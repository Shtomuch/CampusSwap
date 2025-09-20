namespace CampusSwap.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);
    Task<Stream> DownloadFileAsync(string fileUrl);
    Task DeleteFileAsync(string fileUrl);
    Task<string> GenerateThumbnailAsync(string imageUrl);
}