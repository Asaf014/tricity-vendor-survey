export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // The result looks like "data:image/jpeg;base64,/9j/4AAQ..."
      // We need to remove the metadata prefix for Google Script
      if (reader.result.includes(',')) {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
      } else {
          resolve(reader.result);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}