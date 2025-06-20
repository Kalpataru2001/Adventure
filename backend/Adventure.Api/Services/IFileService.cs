namespace Adventure.Api.Services
{
    public interface IFileService
    {
        Task<string> UploadFileAsync(Stream fileStream, string fileExtension, Guid userId, string bucket);
        Task DeleteFileAsync(string bucket, string path);
    }
}
