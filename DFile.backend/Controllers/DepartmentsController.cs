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
    public class DepartmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DepartmentsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Departments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Department>>> GetDepartments()
        {
            return await _context.Departments.ToListAsync();
        }

        // GET: api/Departments/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Department>> GetDepartment(string id)
        {
            var dept = await _context.Departments.FindAsync(id);
            if (dept == null) return NotFound();
            return dept;
        }

        // POST: api/Departments
        [HttpPost]
        public async Task<ActionResult<Department>> CreateDepartment(Department dept)
        {
            if (string.IsNullOrWhiteSpace(dept.Id))
                dept.Id = $"D-{DateTime.UtcNow:yyyyMMddHHmmssfff}";

            _context.Departments.Add(dept);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (_context.Departments.Any(d => d.Id == dept.Id))
                    return Conflict();
                throw;
            }

            return CreatedAtAction(nameof(GetDepartment), new { id = dept.Id }, dept);
        }

        // PUT: api/Departments/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDepartment(string id, Department dept)
        {
            if (id != dept.Id) return BadRequest();

            _context.Entry(dept).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Departments.Any(d => d.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        // PUT: api/Departments/archive/{id}
        [HttpPut("archive/{id}")]
        public async Task<IActionResult> ArchiveDepartment(string id)
        {
            var dept = await _context.Departments.FindAsync(id);
            if (dept == null) return NotFound();

            dept.Status = "Archived";
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
