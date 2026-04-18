/**
 * A pointer to a document that is available for the Copilot to use as context.
 */
export interface DocumentPointer {
  /**
   * A unique identifier for the document.
   */
  id: string;
  /**
   * A human-readable name for the document.
   */
  name: string;
  /**
   * The source URL of the document, if available.
   */
  sourceApplication?: string;
  /**
   * The mime type of the document (e.g. "text/plain", "application/pdf").
   */
  iconImageUri?: string;
  /**
   * A function to get the content of the document.
   */
  getContents: () => Promise<string>;
}
