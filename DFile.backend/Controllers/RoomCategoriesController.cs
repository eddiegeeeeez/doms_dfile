using DFile.backend.Data;
using DFile.backend.DTOs;
using DFile.backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace DFile.backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Super Admin")]
    public class RoomCategoriesController : TenantAwareController
    {
        private readonly AppDbContext _context;

        public RoomCategoriesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoomCategory>>> GetRoomCategories(
            [FromQuery] bool includeArchived = false,
            [FromQuery] string? search = null)
        {
            var tenantId = GetCurrentTenantId();
            var query = _context.RoomCategories.AsQueryable();

            if (!IsSuperAdmin() && tenantId.HasValue)
            {
                query = query.Where(c => c.TenantId == tenantId);
            }

            if (!includeArchived)
            {
                query = query.Where(c => !c.Archived);
            }

            if (!string.IsNullOrEmpty(search))
            {
                search = search.ToLower();
                query = query.Where(c => 
                    c.Name.ToLower().Contains(search) || 
                    (c.Description != null && c.Description.ToLower().Contains(search)));
            }

            return await query.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<RoomCategory>> GetRoomCategory(string id)
        {
            var tenantId = GetCurrentTenantId();
            var roomCategory = await _context.RoomCategories.FindAsync(id);

            if (roomCategory == null) return NotFound();
            if (!IsSuperAdmin() && tenantId.HasValue && roomCategory.TenantId != tenantId) return NotFound();

            return roomCategory;
        }

        [HttpPost]
        public async Task<ActionResult<RoomCategory>> PostRoomCategory(CreateRoomCategoryDto dto)
        {
            var tenantId = GetCurrentTenantId();

            var roomCategory = new RoomCategory
            {
                Id = Guid.NewGuid().ToString(),
                Name = dto.Name,
                SubCategory = dto.SubCategory,
                Description = dto.Description,
                BaseRate = dto.BaseRate,
                MaxOccupancy = dto.MaxOccupancy,
                Status = "Active",
                Archived = false,
                TenantId = IsSuperAdmin() ? null : tenantId
            };

            _context.RoomCategories.Add(roomCategory);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetRoomCategory", new { id = roomCategory.Id }, roomCategory);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutRoomCategory(string id, UpdateRoomCategoryDto dto)
        {
            var tenantId = GetCurrentTenantId();
            var existing = await _context.RoomCategories.FindAsync(id);

            if (existing == null) return NotFound();
            if (!IsSuperAdmin() && tenantId.HasValue && existing.TenantId != tenantId) return NotFound();

            existing.Name = dto.Name;
            existing.SubCategory = dto.SubCategory;
            existing.Description = dto.Description;
            existing.BaseRate = dto.BaseRate;
            existing.MaxOccupancy = dto.MaxOccupancy;
            existing.Archived = dto.Archived;
            existing.Status = dto.Status;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("archive/{id}")]
        public async Task<IActionResult> ArchiveRoomCategory(string id)
        {
            var tenantId = GetCurrentTenantId();
            var category = await _context.RoomCategories.FindAsync(id);

            if (category == null) return NotFound();
            if (!IsSuperAdmin() && tenantId.HasValue && category.TenantId != tenantId) return NotFound();

            category.Archived = true;
            category.Status = "Archived";
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("restore/{id}")]
        public async Task<IActionResult> RestoreRoomCategory(string id)
        {
            var tenantId = GetCurrentTenantId();
            var category = await _context.RoomCategories.FindAsync(id);

            if (category == null) return NotFound();
            if (!IsSuperAdmin() && tenantId.HasValue && category.TenantId != tenantId) return NotFound();

            category.Archived = false;
            category.Status = "Active";
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoomCategory(string id)
        {
            var tenantId = GetCurrentTenantId();
            var roomCategory = await _context.RoomCategories.FindAsync(id);

            if (roomCategory == null) return NotFound();
            if (!IsSuperAdmin() && tenantId.HasValue && roomCategory.TenantId != tenantId) return NotFound();

            _context.RoomCategories.Remove(roomCategory);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
