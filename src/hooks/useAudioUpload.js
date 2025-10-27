export const useAudioUpload = () => {
  const uploadAudio = async (file) => {
    // Receiving the audio file from the input
    try {
      // Validate file type
      const validAudioTypes = [
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/mp3",
        "audio/m4a",
      ];
      if (!validAudioTypes.includes(file.type)) {
        throw new Error(
          "Invalid audio file type. Supported formats: MP3, WAV, OGG, M4A"
        );
      }

      // Check file size (limit to 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("Audio file too large. Maximum size is 10MB");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "user_profile"); // Using the same preset as images

      // Sending request to Cloudinary
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dghyg2w8c/video/upload", // Using video endpoint for audio files
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Failed to upload audio file: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.secure_url;
      // returning the audio file url
    } catch (error) {
      throw error;
    }
  };

  return { uploadAudio };
};
