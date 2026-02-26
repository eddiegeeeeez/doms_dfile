using DFile.backend.Data;
using DFile.backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DFile.backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RolesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RolesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Roles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Role>>> GetRoles()
        {
            return await _context.Roles.ToListAsync();
        }

        // GET: api/Roles/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Role>> GetRole(string id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return NotFound();
            return role;
        }

        // POST: api/Roles
        [HttpPost]
        public async Task<ActionResult<Role>> CreateRole(Role role)
        {
            if (string.IsNullOrWhiteSpace(role.Id))
                role.Id = $"RL-{DateTime.UtcNow:yyyyMMddHHmmssfff}";

            _context.Roles.Add(role);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (_context.Roles.Any(r => r.Id == role.Id))
                    return Conflict();
                throw;
            }

            return CreatedAtAction(nameof(GetRole), new { id = role.Id }, role);
        }

        // PUT: api/Roles/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(string id, Role role)
        {
            if (id != role.Id) return BadRequest();

            _context.Entry(role).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Roles.Any(r => r.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        // PUT: api/Roles/archive/{id}
        [HttpPut("archive/{id}")]
        public async Task<IActionResult> ArchiveRole(string id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return NotFound();

            role.Status = "Archived";
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
