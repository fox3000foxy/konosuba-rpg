declare module 'combine-image' {
  function combineImage(
    images: string[]
  ): Promise<{
    write: (output: string, cb: () => void) => void;
  }>;
  export default combineImage;
}