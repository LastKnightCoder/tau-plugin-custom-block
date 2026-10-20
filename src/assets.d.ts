declare module "*.md" {
  const content: string;
  export default content;
}
declare module "*.md?raw" {
  const content: string;
  export default content;
}
declare module "custom-block:compiler-worker" {
  const source: string;
  export default source;
}
