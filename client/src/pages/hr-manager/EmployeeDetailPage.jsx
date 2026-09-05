import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EmployeeDetails from '../../components/employee/EmployeeDetails.jsx';
import EmployeeForm from '../../components/employee/EmployeeForm.jsx';
import { getEmployeeById, saveEmployee } from '../../data/employeeStore.js';

/**
 * Detailed employee profile page at /employees/:employeeId.
 */
export default function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(() => getEmployeeById(employeeId));
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleBack = () => {
    navigate('/employees');
  };

  const handleEdit = () => {
    setIsEditOpen(true);
  };

  const handleSave = (savedData) => {
    saveEmployee(savedData);
    setEmployee(savedData);
    setIsEditOpen(false);
  };

  return (
    <div className='space-y-6'>
      <EmployeeDetails
        employee={employee}
        onBack={handleBack}
        onEdit={handleEdit}
      />

      {/* Edit Employee Modal */}
      {isEditOpen && (
        <EmployeeForm
          key={employee?.id || 'edit'}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSave}
          initialData={employee}
        />
      )}
    </div>
  );
}
