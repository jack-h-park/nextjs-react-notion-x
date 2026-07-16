import { type ExtendedRecordMap } from "notion-types";

import type { PreparedDocument } from "../pipeline";
import {
  deriveDocIdentifiers,
  type DocIdentifiers,
} from "../../server/doc-identifiers";
import { formatNotionPageId } from "../../server/page-url";
import {
  extractPlainText,
  getPageLastEditedTime,
  getPageTitle,
  getPageUrl,
} from "../index";
import {
  applyDefaultDocMetadata,
  DEFAULT_INGEST_DOC_TYPE,
  DEFAULT_INGEST_PERSONA_TYPE,
  mergeMetadata,
  mergeRagDocumentMetadata,
} from "../metadata";
import {
  buildNotionSourceMetadata,
  extractNotionMetadata,
} from "../notion-metadata";

/**
 * Notion sometimes returns doubly-nested record entries:
 * recordMap.block[id].value = { role, value: Block } instead of the Block
 * itself. notion-utils helpers (getPageContentBlockIds, getBlockTitle, ...)
 * read `.value` directly, so without normalization content traversal silently
 * yields nothing and every page ingests as an empty "Untitled" document.
 * Unwrap once at the fetch boundary so all downstream consumers see the
 * canonical shape. https://github.com/NotionX/react-notion-x/issues/682
 */
function unwrapRecordEntry<T extends { value?: unknown }>(entry: T): T {
  let v: unknown = entry.value;
  while (
    v &&
    typeof v === "object" &&
    !(v as Record<string, unknown>).id &&
    (v as Record<string, unknown>).value
  ) {
    v = (v as Record<string, unknown>).value;
  }
  if (v === entry.value) return entry;
  return { ...entry, value: v };
}

function normalizeRecordTable<T extends Record<string, { value?: unknown }>>(
  table: T | undefined,
): T | undefined {
  if (!table) return table;
  let changed = false;
  const next: Record<string, unknown> = {};
  for (const [id, entry] of Object.entries(table)) {
    const unwrapped = unwrapRecordEntry(entry);
    if (unwrapped !== entry) changed = true;
    next[id] = unwrapped;
  }
  return changed ? (next as T) : table;
}

export function normalizeNotionRecordMap(
  recordMap: ExtendedRecordMap,
): ExtendedRecordMap {
  const block = normalizeRecordTable(recordMap.block);
  const collection = normalizeRecordTable(recordMap.collection);
  if (block === recordMap.block && collection === recordMap.collection) {
    return recordMap;
  }
  return {
    ...recordMap,
    block: block ?? recordMap.block,
    collection: collection ?? recordMap.collection,
  };
}

/**
 * ID-sensitive ingestion path: doc_id/raw_doc_id must always come from
 * deriveDocIdentifiers over the dashed Notion page ID.
 */
export function deriveNotionDocIdentifiers(pageId: string): DocIdentifiers {
  const rawNotionId = formatNotionPageId(pageId) ?? pageId;
  return deriveDocIdentifiers(rawNotionId);
}

export function prepareNotionPageDocument(
  recordMap: ExtendedRecordMap,
  pageId: string,
): PreparedDocument {
  const { canonicalId, rawId } = deriveNotionDocIdentifiers(pageId);
  const normalizedRecordMap = normalizeNotionRecordMap(recordMap);
  // recordMap.block is keyed by dashed UUIDs; a compact pageId (CLI --page
  // input) would silently miss every lookup, so always use the dashed rawId.
  const lookupId = rawId;
  const title = getPageTitle(normalizedRecordMap, lookupId);

  return {
    canonicalId,
    rawId,
    label: `Notion page "${title}" (${pageId})`,
    sourceUrl: getPageUrl(pageId),
    title,
    text: extractPlainText(normalizedRecordMap, lookupId),
    lastSourceUpdate: getPageLastEditedTime(normalizedRecordMap, lookupId),
    statusCode: 200,
    changeDetection: "hash",
    buildMetadata: (existingMetadata) => {
      // Admin-editable fields win over freshly extracted page properties,
      // which in turn win over derived source metadata (icon, breadcrumb, teaser).
      const incomingMetadata = extractNotionMetadata(normalizedRecordMap, lookupId);
      const sourceMetadata = buildNotionSourceMetadata(normalizedRecordMap, lookupId);
      const adminMetadata =
        mergeMetadata(existingMetadata, incomingMetadata) ??
        existingMetadata ??
        null;
      const mergedMetadata = mergeRagDocumentMetadata(
        adminMetadata ?? undefined,
        sourceMetadata,
      );
      return applyDefaultDocMetadata(mergedMetadata, {
        doc_type: DEFAULT_INGEST_DOC_TYPE,
        persona_type: DEFAULT_INGEST_PERSONA_TYPE,
      });
    },
  };
}
