// cloudflare-ai.d.ts
declare module "@cloudflare/ai" {
  export interface Ai {
    run(model: string, inputs: any): Promise<any>;
  }
}
