import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api';

export const ImportTab = () => {
  const { group, id: groupId } = useOutletContext<any>();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [importReport, setImportReport] = useState<any>(null);

  // Anomaly Resolution State
  const [selectedPayerIds, setSelectedPayerIds] = useState<Record<number, string>>({});

  const fetchAnomalies = useCallback(async () => {
    try {
      const data = await api(`/api/groups/${groupId}/anomalies`);
      setAnomalies(data);
    } catch (err) {
      console.error(err);
    }
  }, [groupId]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await api(`/api/groups/${groupId}/import`, {
        method: 'POST',
        body: formData,
        isFormData: true
      });

      setImportReport(data.report);
      await fetchAnomalies();
    } catch (err: any) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  const resolveAnomaly = async (anomalyId: number, action: string, assignedPayerId?: string) => {
    try {
      await api(`/api/groups/${groupId}/anomalies/${anomalyId}/resolve`, {
        method: 'POST',
        body: { action, paid_by_id: assignedPayerId }
      });
      fetchAnomalies();
    } catch (err) {
      console.error(err);
    }
  };

  const pendingAnomalies = anomalies.filter(a => a.status === 'PENDING_APPROVAL');
  const resolvedAnomalies = anomalies.filter(a => a.status === 'AUTO_RESOLVED' || a.status === 'RESOLVED');

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <h2 className="text-xl font-semibold mb-4">Import Expenses CSV</h2>
        <div className="flex items-center space-x-4">
          <input 
            type="file" 
            accept=".csv"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
          />
          <Button onClick={handleUpload} disabled={!file || loading}>
            {loading ? 'Uploading...' : 'Upload Data'}
          </Button>
        </div>
      </Card>

      {importReport && (
        <Card padding="lg">
          <h2 className="text-xl font-semibold mb-4 text-[#5bc5a7]">Import Complete</h2>
          <div className="bg-[#5bc5a7] text-white p-4 rounded-md mb-4 font-medium">
            Processed {importReport.totalRowsProcessed} rows, found {importReport.anomalies.length} anomalies.
          </div>
        </Card>
      )}

      {anomalies.length > 0 && (
        <Card padding="lg">
          <h2 className="text-xl font-semibold mb-4 text-[#ff652f]">Anomaly Report</h2>
          <p className="text-sm text-gray-600 mb-6">
            Found {anomalies.length} total anomalies. {pendingAnomalies.length} require your approval.
          </p>

          {pendingAnomalies.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-orange-600 mb-4">Pending Approvals</h3>
              <div className="space-y-4">
                {pendingAnomalies.map(a => (
                  <div key={a.id} className="p-4 border border-orange-200 bg-orange-50 rounded">
                    <p className="font-medium text-orange-900">Row {a.csv_row_number}: {a.anomaly_type}</p>
                    <p className="text-sm text-orange-800 mt-1 mb-4">{a.description}</p>
                    <div className="flex space-x-3 items-center">
                      {(a.anomaly_type === 'EXACT_DUPLICATE' || a.anomaly_type === 'CONFLICTING_DUPLICATE') && (
                        <>
                          <Button variant="danger" onClick={() => resolveAnomaly(a.id, 'CONFIRM_DUPLICATE')}>
                            Confirm Duplicate
                          </Button>
                          <Button variant="secondary" onClick={() => resolveAnomaly(a.id, 'KEEP_BOTH')}>
                            Keep Both
                          </Button>
                        </>
                      )}
                      
                      {a.anomaly_type === 'MEMBERSHIP_MISMATCH' && (
                        <>
                          <Button variant="primary" onClick={() => resolveAnomaly(a.id, 'INCLUDE_ANYWAY')}>
                            Include Anyway
                          </Button>
                          <Button variant="secondary" onClick={() => resolveAnomaly(a.id, 'EXCLUDE')}>
                            Exclude
                          </Button>
                        </>
                      )}
                      
                      {a.anomaly_type === 'MISSING_PAYER' && (
                        <div className="flex items-center space-x-2 w-full max-w-md">
                          <select 
                            value={selectedPayerIds[a.id] || ''}
                            onChange={(e) => setSelectedPayerIds({ ...selectedPayerIds, [a.id]: e.target.value })}
                            className="border border-gray-300 rounded-md p-2 text-sm flex-1 focus:outline-none focus:ring-[#5bc5a7] focus:border-[#5bc5a7]"
                          >
                            <option value="">Select payer...</option>
                            {group.memberships.map((m: any) => (
                              <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                            ))}
                          </select>
                          <Button 
                            variant="primary" 
                            onClick={() => {
                              const selectedPayer = selectedPayerIds[a.id];
                              if (selectedPayer) {
                                resolveAnomaly(a.id, 'ASSIGN_PAYER', selectedPayer);
                              } else {
                                alert("Please select a payer first.");
                              }
                            }}
                          >
                            Assign Payer
                          </Button>
                        </div>
                      )}
                      
                      {!['EXACT_DUPLICATE', 'CONFLICTING_DUPLICATE', 'MEMBERSHIP_MISMATCH', 'MISSING_PAYER'].includes(a.anomaly_type) && (
                        <Button variant="primary" onClick={() => resolveAnomaly(a.id, 'ACKNOWLEDGE')}>
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Resolved Actions Log</h3>
            <div className="space-y-2">
              {resolvedAnomalies.map(a => (
                <div key={a.id} className="p-3 bg-gray-50 border border-gray-100 rounded flex justify-between">
                  <div>
                    <span className="font-medium text-sm">Row {a.csv_row_number} - {a.anomaly_type}</span>
                    <p className="text-xs text-gray-500">{a.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-[#5bc5a7]">{a.action_taken || a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
