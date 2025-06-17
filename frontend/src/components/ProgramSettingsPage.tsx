import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Layout from './Layout';

// Types for WBS
interface WbsSubcategory {
  id: string;
  name: string;
}
interface WbsCategory {
  id: string;
  name: string;
  subcategories: WbsSubcategory[];
}

const ProgramSettingsPage: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingWBS, setSavingWBS] = useState(false);
  const [program, setProgram] = useState<any>(null);
  const [programForm, setProgramForm] = useState<any>({});
  const [wbsList, setWbsList] = useState<WbsCategory[]>([]);
  const [wbsEdit, setWbsEdit] = useState<WbsCategory[]>([]);
  const [wbsError, setWbsError] = useState<string | null>(null);
  const [wbsSuccess, setWbsSuccess] = useState<string | null>(null);

  // Fetch program info and WBS
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const progRes = await axios.get(`/api/programs/${id}`);
        setProgram(progRes.data);
        setProgramForm({ ...progRes.data });
        // Fetch WBS from backend
        const wbsRes = await axios.get(`/api/programs/${id}/wbs`);
        setWbsList(wbsRes.data);
        setWbsEdit(JSON.parse(JSON.stringify(wbsRes.data)));
      } catch (err: any) {
        setError('Failed to load program or WBS data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Handlers for program info
  const handleProgramChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProgramForm((prev: any) => ({ ...prev, [name]: value }));
  };
  const handleSaveProgram = async () => {
    setSavingInfo(true);
    setError(null);
    try {
      await axios.put(`/api/programs/${id}`, programForm);
      setProgram({ ...program, ...programForm });
    } catch (err: any) {
      setError('Failed to save program info.');
    } finally {
      setSavingInfo(false);
    }
  };

  // WBS Handlers
  // Category
  const handleWbsCategoryChange = (catIdx: number, value: string) => {
    setWbsEdit(wbsEdit => wbsEdit.map((w, i) => i === catIdx ? { ...w, name: value } : w));
  };
  const handleAddCategory = async () => {
    setSavingWBS(true);
    setWbsError(null);
    try {
      const res = await axios.post(`/api/programs/${id}/wbs/categories`, { name: '' });
      setWbsList(list => [...list, { ...res.data, subcategories: [] }]);
      setWbsEdit(edit => [...edit, { ...res.data, subcategories: [] }]);
    } catch (err: any) {
      setWbsError('Failed to add category.');
    } finally {
      setSavingWBS(false);
    }
  };
  const handleDeleteCategory = async (catIdx: number) => {
    const cat = wbsEdit[catIdx];
    if (!cat.id) return;
    setSavingWBS(true);
    setWbsError(null);
    try {
      await axios.delete(`/api/programs/wbs/categories/${cat.id}`);
      setWbsList(list => list.filter((_, i) => i !== catIdx));
      setWbsEdit(edit => edit.filter((_, i) => i !== catIdx));
    } catch (err: any) {
      setWbsError('Failed to delete category.');
    } finally {
      setSavingWBS(false);
    }
  };
  const handleSaveCategory = async (catIdx: number) => {
    const cat = wbsEdit[catIdx];
    if (!cat.id) return;
    setSavingWBS(true);
    setWbsError(null);
    try {
      await axios.put(`/api/programs/wbs/categories/${cat.id}`, { name: cat.name });
      // Update local state
      setWbsList(list => list.map((w, i) => i === catIdx ? { ...w, name: cat.name } : w));
    } catch (err: any) {
      setWbsError('Failed to save category.');
    } finally {
      setSavingWBS(false);
    }
  };

  // Subcategory
  const handleWbsSubChange = (catIdx: number, subIdx: number, value: string) => {
    setWbsEdit(wbsEdit => wbsEdit.map((w, i) => i === catIdx ? {
      ...w,
      subcategories: w.subcategories.map((s, j) => j === subIdx ? { ...s, name: value } : s)
    } : w));
  };
  const handleAddSub = async (catIdx: number) => {
    const cat = wbsEdit[catIdx];
    if (!cat.id) return;
    setSavingWBS(true);
    setWbsError(null);
    try {
      const res = await axios.post(`/api/programs/wbs/categories/${cat.id}/subcategories`, { name: '' });
      setWbsList(list => list.map((w, i) => i === catIdx ? { ...w, subcategories: [...w.subcategories, res.data] } : w));
      setWbsEdit(edit => edit.map((w, i) => i === catIdx ? { ...w, subcategories: [...w.subcategories, res.data] } : w));
    } catch (err: any) {
      setWbsError('Failed to add subcategory.');
    } finally {
      setSavingWBS(false);
    }
  };
  const handleDeleteSub = async (catIdx: number, subIdx: number) => {
    const sub = wbsEdit[catIdx].subcategories[subIdx];
    if (!sub.id) return;
    setSavingWBS(true);
    setWbsError(null);
    try {
      await axios.delete(`/api/programs/wbs/subcategories/${sub.id}`);
      setWbsList(list => list.map((w, i) => i === catIdx ? { ...w, subcategories: w.subcategories.filter((_, j) => j !== subIdx) } : w));
      setWbsEdit(edit => edit.map((w, i) => i === catIdx ? { ...w, subcategories: w.subcategories.filter((_, j) => j !== subIdx) } : w));
    } catch (err: any) {
      setWbsError('Failed to delete subcategory.');
    } finally {
      setSavingWBS(false);
    }
  };
  const handleSaveSub = async (catIdx: number, subIdx: number) => {
    const sub = wbsEdit[catIdx].subcategories[subIdx];
    if (!sub.id) return;
    setSavingWBS(true);
    setWbsError(null);
    try {
      await axios.put(`/api/programs/wbs/subcategories/${sub.id}`, { name: sub.name });
      setWbsList(list => list.map((w, i) => i === catIdx ? {
        ...w,
        subcategories: w.subcategories.map((s, j) => j === subIdx ? { ...s, name: sub.name } : s)
      } : w));
    } catch (err: any) {
      setWbsError('Failed to save subcategory.');
    } finally {
      setSavingWBS(false);
    }
  };

  // Update API paths for WBS category/subcategory update/delete
  const handleSaveWBS = async () => {
    setSavingWBS(true);
    setWbsError(null);
    setWbsSuccess(null);
    try {
      // Save all categories
      for (const cat of wbsEdit) {
        if (cat.id) {
          await axios.put(`/api/programs/wbs/categories/${cat.id}`, { name: cat.name });
        }
        // Save all subcategories for this category
        for (const sub of cat.subcategories) {
          if (sub.id) {
            await axios.put(`/api/programs/wbs/subcategories/${sub.id}`, { name: sub.name });
          }
        }
      }
      setWbsList(JSON.parse(JSON.stringify(wbsEdit)));
      setWbsSuccess('WBS Saved');
      setTimeout(() => setWbsSuccess(null), 3000);
    } catch (err: any) {
      setWbsError('Failed to save WBS data.');
    } finally {
      setSavingWBS(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Program Settings</h1>
        {loading ? (
          <div className="text-gray-500 text-lg">Loading...</div>
        ) : error ? (
          <div className="text-red-600 text-lg mb-4">{error}</div>
        ) : (
          <>
            {/* Program Info Section */}
            <section className="mb-10 bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Program Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Program Name</label>
                  <input name="name" className="input-field" value={programForm.name || ''} onChange={handleProgramChange} />
                </div>
                <div>
                  <label className="form-label">Program Code</label>
                  <input name="code" className="input-field" value={programForm.code || ''} onChange={handleProgramChange} />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select name="status" className="input-field" value={programForm.status || ''} onChange={handleProgramChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select name="type" className="input-field" value={programForm.type || ''} onChange={handleProgramChange}>
                    <option value="Annual">Annual</option>
                    <option value="Period of Performance">Period of Performance</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Start Date</label>
                  <input name="startDate" type="date" className="input-field" value={programForm.startDate ? programForm.startDate.slice(0,10) : ''} onChange={handleProgramChange} />
                </div>
                <div>
                  <label className="form-label">End Date</label>
                  <input name="endDate" type="date" className="input-field" value={programForm.endDate ? programForm.endDate.slice(0,10) : ''} onChange={handleProgramChange} />
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Description</label>
                  <textarea name="description" className="input-field" rows={3} value={programForm.description || ''} onChange={handleProgramChange} />
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Budget</label>
                  <input name="totalBudget" type="number" className="input-field" value={programForm.totalBudget || ''} onChange={handleProgramChange} />
                </div>
              </div>
              <button className="btn-primary mt-6" onClick={handleSaveProgram} disabled={savingInfo}>{savingInfo ? 'Saving...' : 'Save Program Info'}</button>
            </section>
            {/* WBS Management Section */}
            <section className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">WBS Categories & Subcategories</h2>
              {wbsError && <div className="text-red-600 mb-2">{wbsError}</div>}
              {wbsSuccess && <div className="text-green-600 mb-2">{wbsSuccess}</div>}
              <div className="space-y-6">
                {wbsEdit.map((cat, catIdx) => (
                  <div key={cat.id || catIdx} className="border-b pb-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        className="input-field w-64"
                        value={cat.name}
                        onChange={e => handleWbsCategoryChange(catIdx, e.target.value)}
                        placeholder="Category name"
                        onBlur={() => handleSaveCategory(catIdx)}
                      />
                      <button className="btn-secondary" onClick={() => handleDeleteCategory(catIdx)} type="button">Delete Category</button>
                    </div>
                    <div className="ml-6 space-y-2">
                      {cat.subcategories.map((sub, subIdx) => (
                        <div key={sub.id || subIdx} className="flex items-center gap-2">
                          <input
                            className="input-field w-56"
                            value={sub.name}
                            onChange={e => handleWbsSubChange(catIdx, subIdx, e.target.value)}
                            placeholder="Subcategory name"
                            onBlur={() => handleSaveSub(catIdx, subIdx)}
                          />
                          <button className="btn-secondary" onClick={() => handleDeleteSub(catIdx, subIdx)} type="button">Delete</button>
                        </div>
                      ))}
                      <button className="btn-primary mt-2" onClick={() => handleAddSub(catIdx)} type="button">Add Subcategory</button>
                    </div>
                  </div>
                ))}
                <button className="btn-primary" onClick={handleAddCategory} type="button">Add Category</button>
              </div>
              <button className="btn-primary mt-6" onClick={handleSaveWBS} disabled={savingWBS}>{savingWBS ? 'Saving...' : 'Save WBS'}</button>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ProgramSettingsPage; 