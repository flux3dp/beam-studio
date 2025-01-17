// ref https://developer.mozilla.org/en-US/docs/Web/API/Blob/arrayBuffer
// get arrayBuffer with FileReader in some case arrayBuffer method is not implemented

const arrayBuffer = async (blob: Blob): Promise<ArrayBuffer> => {
  if (blob.arrayBuffer) {
    return blob.arrayBuffer();
  }
  return new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result as ArrayBuffer);
    };
    fileReader.readAsArrayBuffer(blob);
  });
};

export default arrayBuffer;
