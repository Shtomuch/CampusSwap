namespace CampusSwap.Domain.Common;

public interface IAuditableEntity
{
    string? CreatedBy { get; set; }
    string? UpdatedBy { get; set; }
}