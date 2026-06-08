import React, { useEffect, useState } from 'react';

interface StaffMeal {
  id: string;
  staffMember: { name: string; role: string; shift: string };
  mealType: string;
  servedAt: string;
  items: { name: string; quantity: number }[];
}

export default function StaffMealPanel({ from, to }: { from: string; to: string }) {
  const [role, setRole] = useState('CASHIER');
  const [meals, setMeals] = useState<StaffMeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.role) {
          setRole(data.role);
        }
      })
      .catch(err => console.error('Error fetching session:', err));
  }, []);

  const fetchMeals = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const res = await fetch(`/api/staff-meals?${params.toString()}`);
    if (res.ok) setMeals(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchMeals();
  }, [from, to]);

  const handleAddMeal = () => {
    // Placeholder – actual implementation would open a modal/form
    alert('Add Staff Meal (admin only)');
  };

  return (
    <div className="card" style={{ background: 'var(--black-card)', border: '1px solid var(--gold-dark)', marginTop: '24px' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--gold-dark)' }}>
        <h3 style={{ margin: 0, color: 'var(--gold)', fontSize: '18px' }}>Staff Meals</h3>
        {role === 'ADMIN' && (
          <button className="btn btn-gold btn-sm" onClick={handleAddMeal}>Add Meal</button>
        )}
      </div>
      <div className="card-body" style={{ padding: '16px' }}>
        {loading ? (
          <div>Loading staff meals...</div>
        ) : meals.length === 0 ? (
          <div>No staff meals recorded for the selected period.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(212,175,55,0.1)' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Staff</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Meal Type</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Served At</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Items</th>
              </tr>
            </thead>
            <tbody>
              {meals.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--black-border)' }}>
                  <td style={{ padding: '8px' }}>{m.staffMember.name} ({m.staffMember.role})</td>
                  <td style={{ padding: '8px' }}>{m.mealType}</td>
                  <td style={{ padding: '8px' }}>{new Date(m.servedAt).toLocaleString()}</td>
                  <td style={{ padding: '8px' }}>
                    {m.items.map(i => (
                      <div key={i.name}>{i.name} × {i.quantity}</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
