import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { FilterPreset } from '../entities/FilterPreset';

const router = Router();
const presetRepo = AppDataSource.getRepository(FilterPreset);

function getUserId(req: any): string {
  return (req.body?.userId || (req.headers['user-id'] as string) || 'anonymous').toString();
}

// GET /api/programs/:id/filter-presets
router.get('/programs/:id/filter-presets', async (req, res) => {
  try {
    const programId = req.params.id;
    const userId = getUserId(req);
    const presets = await presetRepo.find({ where: { programId, userId }, order: { updatedAt: 'DESC' } });
    res.json(presets);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load presets' });
  }
});

// POST /api/programs/:id/filter-presets  { name, filters }
router.post('/programs/:id/filter-presets', async (req, res) => {
  try {
    const programId = req.params.id;
    const userId = getUserId(req);
    const { name, filters } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });

    // Upsert by (programId, userId, name)
    let preset = await presetRepo.findOne({ where: { programId, userId, name } });
    if (preset) {
      preset.filters = filters;
    } else {
      preset = presetRepo.create({ programId, userId, name, filters });
    }
    const saved = await presetRepo.save(preset);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save preset' });
  }
});

// DELETE /api/programs/:id/filter-presets/:presetId
router.delete('/programs/:id/filter-presets/:presetId', async (req, res) => {
  try {
    const programId = req.params.id;
    const userId = getUserId(req);
    const { presetId } = req.params;
    const preset = await presetRepo.findOne({ where: { id: presetId, programId, userId } });
    if (!preset) return res.status(404).json({ message: 'Preset not found' });
    await presetRepo.remove(preset);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete preset' });
  }
});

export default router;


