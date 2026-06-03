using HouseRentingSystemApi.Data;
using HouseRentingSystemApi.Data.Entities;
using HouseRentingSystemApi.Models;
using HouseRentingSystemApi.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HouseRentingSystemApi.Services
{
    public class HouseService : IHouseService
    {
        private readonly AppDbContext context;

        public HouseService(AppDbContext context)
        {
            this.context = context;
        }

        public async Task<(List<HouseDetailModel> Items, int TotalCount, int Page, int PageSize)> GetAllAsync(string? search, string? category, decimal? minPrice, decimal? maxPrice, int page, int pageSize)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 50);

            var query = context.Houses.AsNoTracking().Include(h => h.Category).AsQueryable();
            query = ApplySearch(query, search);
            query = ApplyCategory(query, category);
            query = ApplyPriceRange(query, minPrice, maxPrice);

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(h => h.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(h => new HouseDetailModel
                {
                    Id = h.Id,
                    Title = h.Title,
                    Address = h.Address,
                    ImageUrl = h.ImageUrl,
                    Description = h.Description,
                    PricePerMonth = h.PricePerMonth,
                    Category = ParseCategory(h.Category.Name)
                })
                .ToListAsync();

            return (items, totalCount, page, pageSize);
        }

        public async Task<List<(decimal Min, decimal Max, int Count)>> GetPriceRangesAsync(string? category)
        {
            var query = context.Houses
                .AsNoTracking()
                .Include(h => h.Category)
                .AsQueryable();
            if (!string.IsNullOrWhiteSpace(category))
            {
                var normalizedCategory = category.Trim().ToLower();
                query = query.Where(h => h.Category != null && h.Category.Name.ToLower() == normalizedCategory);
            }

            var prices = await query.Select(h => h.PricePerMonth).ToListAsync();
            if (prices.Count == 0)
            {
                return new List<(decimal Min, decimal Max, int Count)>();
            }

            var maxPrice = prices.Max();
            const decimal rangeStep = 200m;

            var start = 0m;
            var end = Math.Ceiling(maxPrice / rangeStep) * rangeStep;
            if (end <= start)
            {
                end = start + rangeStep;
            }

            var ranges = new List<(decimal Min, decimal Max, int Count)>();
            for (var current = start; current < end; current += rangeStep)
            {
                var rangeMin = current;
                var rangeMax = current + rangeStep;
                var count = prices.Count(p => p >= rangeMin && p < rangeMax);
                ranges.Add((rangeMin, rangeMax, count));
            }

            return ranges;
        }

        public async Task<List<string>> GetCategoriesAsync()
        {
            await Task.CompletedTask;
            return Enum.GetNames<CategoryViewEnum>().OrderBy(n => n).ToList();
        }

        public async Task<(List<HouseDetailModel> Items, int TotalCount, int Page, int PageSize)> GetMineAsync(string userId, string? search, int page, int pageSize)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 50);

            var query = context.Houses
                .AsNoTracking()
                .Include(h => h.Category)
                .Where(h => h.UserId == userId)
                .AsQueryable();

            query = ApplySearch(query, search);

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(h => h.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(h => new HouseDetailModel
                {
                    Id = h.Id,
                    Title = h.Title,
                    Address = h.Address,
                    ImageUrl = h.ImageUrl,
                    Description = h.Description,
                    PricePerMonth = h.PricePerMonth,
                    Category = ParseCategory(h.Category.Name)
                })
                .ToListAsync();

            return (items, totalCount, page, pageSize);
        }

        public async Task<HouseDetailModel?> GetByIdAsync(int id)
        {
            var house = await context.Houses
                .AsNoTracking()
                .Include(h => h.Category)
                .FirstOrDefaultAsync(h => h.Id == id);

            if (house == null)
            {
                return null;
            }

            return new HouseDetailModel
            {
                Id = house.Id,
                Title = house.Title,
                Address = house.Address,
                ImageUrl = house.ImageUrl,
                Description = house.Description,
                PricePerMonth = house.PricePerMonth,
                Category = ParseCategory(house.Category?.Name)
            };
        }

        public async Task<HouseDetailModel> CreateAsync(HouseDetailModel model, string userId)
        {
            var newHouse = new House
            {
                Description = model.Description,
                PricePerMonth = model.PricePerMonth,
                Address = model.Address,
                Title = model.Title,
                ImageUrl = model.ImageUrl,
                UserId = userId
            };

            var category = await context.Categories.FirstOrDefaultAsync(c => c.Name == model.Category.ToString());
            if (category == null)
            {
                var newCategory = new Category
                {
                    Name = model.Category.ToString()
                };
                context.Categories.Add(newCategory);
                await context.SaveChangesAsync();
                newHouse.CategoryId = newCategory.Id;
            }
            else
            {
                newHouse.CategoryId = category.Id;
            }

            context.Houses.Add(newHouse);
            await context.SaveChangesAsync();

            return new HouseDetailModel
            {
                Id = newHouse.Id,
                Address = newHouse.Address,
                ImageUrl = newHouse.ImageUrl,
                Title = newHouse.Title,
                Description = newHouse.Description,
                PricePerMonth = newHouse.PricePerMonth,
                Category = model.Category
            };
        }

        public async Task<(HouseDetailModel? House, bool IsNotFound, bool IsForbidden)> EditAsync(int id, HouseDetailModel model, string userId)
        {
            var house = await context.Houses
                .Include(h => h.Category)
                .FirstOrDefaultAsync(h => h.Id == id);

            if (house == null)
            {
                return (null, true, false);
            }

            if (house.UserId != userId)
            {
                return (null, false, true);
            }

            house.Title = model.Title;
            house.Address = model.Address;
            house.Description = model.Description;
            house.ImageUrl = model.ImageUrl;
            house.PricePerMonth = model.PricePerMonth;

            var category = await context.Categories.FirstOrDefaultAsync(c => c.Name == model.Category.ToString());
            if (category == null)
            {
                category = new Category
                {
                    Name = model.Category.ToString()
                };
                context.Categories.Add(category);
                await context.SaveChangesAsync();
            }

            house.CategoryId = category.Id;
            await context.SaveChangesAsync();

            var result = new HouseDetailModel
            {
                Id = house.Id,
                Title = house.Title,
                Address = house.Address,
                Description = house.Description,
                ImageUrl = house.ImageUrl,
                PricePerMonth = house.PricePerMonth,
                Category = model.Category
            };

            return (result, false, false);
        }

        public async Task<(bool IsNotFound, bool IsForbidden)> DeleteAsync(int id, string userId)
        {
            var house = await context.Houses.FirstOrDefaultAsync(h => h.Id == id);

            if (house == null)
            {
                return (true, false);
            }

            context.Houses.Remove(house);
            await context.SaveChangesAsync();
            return (false, false);
        }

        public async Task<(bool Ok, bool NotFound, bool Duplicate)> ReserveAsync(int houseId, string userId)
        {
            var exists = await context.Houses.AsNoTracking().AnyAsync(h => h.Id == houseId);
            if (!exists)
            {
                return (Ok: false, NotFound: true, Duplicate: false);
            }

            var duplicate = await context.HouseReservations.AsNoTracking()
                .AnyAsync(r => r.HouseId == houseId && r.UserId == userId);
            if (duplicate)
            {
                return (Ok: false, NotFound: false, Duplicate: true);
            }

            context.HouseReservations.Add(new HouseReservation
            {
                HouseId = houseId,
                UserId = userId,
                CreatedAtUtc = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
            return (Ok: true, NotFound: false, Duplicate: false);
        }

        private static IQueryable<House> ApplySearch(IQueryable<House> query, string? search)
        {
            if (string.IsNullOrWhiteSpace(search))
            {
                return query;
            }

            var normalizedSearch = search.Trim().ToLower();
            return query.Where(h =>
                h.Title.ToLower().Contains(normalizedSearch) ||
                h.Address.ToLower().Contains(normalizedSearch));
        }

        private static IQueryable<House> ApplyCategory(IQueryable<House> query, string? category)
        {
            if (string.IsNullOrWhiteSpace(category))
            {
                return query;
            }

            var normalizedCategory = category.Trim().ToLower();
            return query.Where(h => h.Category != null && h.Category.Name.ToLower() == normalizedCategory);
        }

        private static IQueryable<House> ApplyPriceRange(IQueryable<House> query, decimal? minPrice, decimal? maxPrice)
        {
            if (minPrice.HasValue)
            {
                query = query.Where(h => h.PricePerMonth >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(h => h.PricePerMonth < maxPrice.Value);
            }

            return query;
        }

        private static Models.Enums.CategoryViewEnum ParseCategory(string? categoryName)
        {
            if (string.IsNullOrWhiteSpace(categoryName))
            {
                return Models.Enums.CategoryViewEnum.SingleBedroom;
            }

            return Enum.TryParse<Models.Enums.CategoryViewEnum>(categoryName, out var parsed)
                ? parsed
                : Models.Enums.CategoryViewEnum.SingleBedroom;
        }
    }
}
