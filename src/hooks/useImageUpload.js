export const useImageUpload = () => {
  const uploadImage = async (file) => {
    // resiving the file from the input
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "user_profile");
      // appending the file to the form data

      // Sending request to Cloudinary
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dghyg2w8c/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      // posting the data to cloudinary

      const data = await response.json();
      return data.secure_url;
      // returning the image url
    } catch (error) {
    }
  };
  return { uploadImage };
};
