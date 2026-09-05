import React from 'react';

function HierarchyNode({ node, level = 0 }) {
  const managerName = node.manager?.firstName
    ? `${node.manager.firstName} ${node.manager.lastName || ''}`.trim()
    : typeof node.manager === 'string'
    ? node.manager
    : 'Unassigned';

  const count = node.employeeCount ?? node.headCount ?? 0;
  const children = node.children || node.subDepartments || [];

  return (
    <div className='space-y-3'>
      <div
        className={`p-4 rounded-2xl border transition-all ${
          level === 0
            ? 'bg-white border-[#714B67]/30 shadow-xs'
            : 'bg-[#FAF8F5] border-[#EAE6DF]'
        }`}
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex items-center gap-2.5'>
            <div className='w-8 h-8 rounded-xl bg-purple-100 text-[#714B67] font-black text-xs flex items-center justify-center shadow-2xs'>
              {node.code || node.name.charAt(0)}
            </div>
            <div>
              <h4 className='text-xs font-black text-[#1E293B]'>{node.name}</h4>
              <p className='text-[10px] text-gray-500 font-mono'>
                Manager: <strong className='text-gray-700'>{managerName}</strong>
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200'>
              {count} {count === 1 ? 'Staff' : 'Staff'}
            </span>
            {children.length > 0 && (
              <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#714B67] border border-purple-200'>
                {children.length} Sub-units
              </span>
            )}
          </div>
        </div>
      </div>

      {children.length > 0 && (
        <div className='space-y-2 border-l-2 border-dashed border-gray-200 ml-4 pl-2'>
          {children.map((child) => (
            <HierarchyNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Organizational department hierarchy view component.
 *
 * @param {Object} props
 * @param {Array} props.hierarchy - Array of root department hierarchy nodes
 * @param {Array} [props.departments=[]] - Flat list fallback if hierarchy is not pre-nested
 */
export default function DepartmentHierarchy({ hierarchy = [], departments = [] }) {
  // If hierarchy is not provided as a nested tree, construct it from flat list
  const tree = React.useMemo(() => {
    if (Array.isArray(hierarchy) && hierarchy.length > 0 && hierarchy[0].children !== undefined) {
      return hierarchy;
    }
    if (!departments || departments.length === 0) return [];

    const map = {};
    const roots = [];

    departments.forEach((d) => {
      map[d.id] = { ...d, children: [] };
    });

    departments.forEach((d) => {
      if (d.parentDepartmentId && map[d.parentDepartmentId]) {
        map[d.parentDepartmentId].children.push(map[d.id]);
      } else {
        roots.push(map[d.id]);
      }
    });

    return roots;
  }, [hierarchy, departments]);

  if (!tree || tree.length === 0) {
    return (
      <div className='p-8 text-center text-xs text-gray-400 bg-white rounded-2xl border border-[#EAE6DF] font-medium'>
        No organizational hierarchy defined yet.
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='text-xs text-gray-500 font-medium pb-2 border-b border-gray-100'>
        Organizational reporting structure and child business units
      </div>

      <div className='space-y-4'>
        {tree.map((rootNode) => (
          <HierarchyNode key={rootNode.id} node={rootNode} level={0} />
        ))}
      </div>
    </div>
  );
}
