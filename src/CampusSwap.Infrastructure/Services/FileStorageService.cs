using Azure.Storage.Blobs;
using CampusSwap.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CampusSwap.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<FileStorageService> _logger;
    private readonly BlobServiceClient? _blobServiceClient;
    private readonly string _containerName;

    public FileStorageService(IConfiguration configuration, ILogger<FileStorageService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        var connectionString = _configuration["Azure:StorageConnectionString"];
        if (!string.IsNullOrEmpty(connectionString))
        {
            _blobServiceClient = new BlobServiceClient(connectionString);
        }
        
        _containerName = _configuration["Azure:ContainerName"] ?? "campusswap-images";
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        if (_blobServiceClient == null)
        {
            _logger.LogWarning("Azure Storage is not configured. Using local file storage.");
            return await SaveFileLocallyAsync(fileStream, fileName);
        }

        try
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            await containerClient.CreateIfNotExistsAsync();
            
            var blobName = $"{Guid.NewGuid()}-{fileName}";
            var blobClient = containerClient.GetBlobClient(blobName);
            
            await blobClient.UploadAsync(fileStream, new Azure.Storage.Blobs.Models.BlobHttpHeaders
            {
                ContentType = contentType
            });
            
            return blobClient.Uri.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file to Azure Storage");
            throw;
        }
    }

    public async Task<Stream> DownloadFileAsync(string fileUrl)
    {
        if (_blobServiceClient == null)
        {
            return await ReadFileLocallyAsync(fileUrl);
        }

        try
        {
            var uri = new Uri(fileUrl);
            var blobName = uri.Segments.Last();
            
            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            var blobClient = containerClient.GetBlobClient(blobName);
            
            var response = await blobClient.DownloadAsync();
            return response.Value.Content;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading file from Azure Storage");
            throw;
        }
    }

    public async Task DeleteFileAsync(string fileUrl)
    {
        if (_blobServiceClient == null)
        {
            await DeleteFileLocallyAsync(fileUrl);
            return;
        }

        try
        {
            var uri = new Uri(fileUrl);
            var blobName = uri.Segments.Last();
            
            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            var blobClient = containerClient.GetBlobClient(blobName);
            
            await blobClient.DeleteIfExistsAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file from Azure Storage");
        }
    }

    public async Task<string> GenerateThumbnailAsync(string imageUrl)
    {
        // This is a placeholder implementation
        // In production, you would use an image processing library like ImageSharp
        _logger.LogInformation("Generating thumbnail for {ImageUrl}", imageUrl);
        return await Task.FromResult(imageUrl); // Return original for now
    }

    private async Task<string> SaveFileLocallyAsync(Stream fileStream, string fileName)
    {
        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsFolder);
        
        var uniqueFileName = $"{Guid.NewGuid()}-{fileName}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);
        
        using (var fileStreamOutput = new FileStream(filePath, FileMode.Create))
        {
            await fileStream.CopyToAsync(fileStreamOutput);
        }
        
        // Return full URL for local development
        var baseUrl = _configuration["ApiBaseUrl"] ?? "http://localhost:5000";
        return $"{baseUrl}/uploads/{uniqueFileName}";
    }

    private async Task<Stream> ReadFileLocallyAsync(string fileUrl)
    {
        var fileName = Path.GetFileName(fileUrl);
        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", fileName);
        
        if (!File.Exists(filePath))
            throw new FileNotFoundException($"File not found: {filePath}");
        
        return await Task.FromResult(new FileStream(filePath, FileMode.Open, FileAccess.Read));
    }

    private async Task DeleteFileLocallyAsync(string fileUrl)
    {
        var fileName = Path.GetFileName(fileUrl);
        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", fileName);
        
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
        
        await Task.CompletedTask;
    }
}