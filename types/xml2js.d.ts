declare module 'xml2js' {
  export interface ParserOptions {
    explicitArray?: boolean;
    [key: string]: unknown;
  }

  export function parseStringPromise(xml: string, options?: ParserOptions): Promise<any>;
}
