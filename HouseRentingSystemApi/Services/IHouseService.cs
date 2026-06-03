using HouseRentingSystemApi.Models;

namespace HouseRentingSystemApi.Services
{
    public interface IHouseService
    {
        Task<(List<HouseDetailModel> Items, int TotalCount, int Page, int PageSize)> GetAllAsync(string? search, string? category, decimal? minPrice, decimal? maxPrice, int page, int pageSize);
        Task<(List<HouseDetailModel> Items, int TotalCount, int Page, int PageSize)> GetMineAsync(string userId, string? search, int page, int pageSize);
        Task<List<(decimal Min, decimal Max, int Count)>> GetPriceRangesAsync(string? category);
        Task<List<string>> GetCategoriesAsync();
        Task<HouseDetailModel?> GetByIdAsync(int id);
        Task<HouseDetailModel> CreateAsync(HouseDetailModel model, string userId);
        Task<(HouseDetailModel? House, bool IsNotFound, bool IsForbidden)> EditAsync(int id, HouseDetailModel model, string userId);
        Task<(bool IsNotFound, bool IsForbidden)> DeleteAsync(int id, string userId);

        Task<(bool Ok, bool NotFound, bool Duplicate)> ReserveAsync(int houseId, string userId);
    }
}
