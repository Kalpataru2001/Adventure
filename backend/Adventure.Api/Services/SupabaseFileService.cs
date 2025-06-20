using Supabase.Storage;
using System.IO;

namespace Adventure.Api.Services
{
    public class SupabaseFileService : IFileService
    {
        private readonly Supabase.Client _client;

        public SupabaseFileService(IConfiguration config)
        {
            var url = config["Supabase:Url"];
            var key = config["Supabase:ServiceKey"];
            var options = new Supabase.SupabaseOptions { AutoConnectRealtime = false };
            _client = new Supabase.Client(url, key, options);
        }

        // --- UPDATED AND RENAMED METHOD ---
        // It now accepts a 'bucket' parameter to be more reusable.
        public async Task<string> UploadFileAsync(Stream fileStream, string fileExtension, Guid userId, string bucket)
        {
            // The path in the bucket is now structured: /bucketName/userId/uniqueFileName.ext
            var path = $"{userId}/{DateTime.UtcNow.Ticks}{fileExtension}";

            await using var memoryStream = new MemoryStream();
            await fileStream.CopyToAsync(memoryStream);
            var bytes = memoryStream.ToArray();

            // Use the 'bucket' parameter to upload to the correct place.
            await _client.Storage.From(bucket).Upload(bytes, path, new Supabase.Storage.FileOptions { Upsert = false });

            // Return the public URL for the newly uploaded file.
            return _client.Storage.From(bucket).GetPublicUrl(path);
        }

        // --- NEWLY IMPLEMENTED METHOD ---
        public async Task DeleteFileAsync(string bucket, string path)
        {
            // Supabase's Remove method expects a List of file paths to delete.
            await _client.Storage.From(bucket).Remove(new List<string> { path });
        }
    }
}