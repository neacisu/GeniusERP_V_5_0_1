type StatCardProps = {
  title: string;
  value: string;
  change: {
    value: string;
    isPositive: boolean;
  };
  icon: string;
  iconColor: string;
};

export default function StatCard({ title, value, change, icon, iconColor }: StatCardProps) {
  const getColorClass = () => {
    switch (iconColor) {
      case 'primary':
        return 'bg-primary/10 text-primary';
      case 'success':
        return 'bg-success-light/10 text-success-main';
      case 'error':
        return 'bg-error-light/10 text-error-main';
      case 'info':
        return 'bg-info-light/10 text-info-main';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  const getChangeColorClass = () => {
    return change.isPositive ? 'text-success-main' : 'text-error-main';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-2xl font-semibold mt-2">{value}</h3>
          <div className="flex items-center mt-2">
            <span className={`material-icons text-sm ${getChangeColorClass()}`}>
              {change.isPositive ? 'arrow_upward' : 'arrow_downward'}
            </span>
            <span className={`text-sm ml-1 ${getChangeColorClass()}`}>{change.value}</span>
            <span className="text-xs text-gray-500 ml-2">vs. luna trecută</span>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClass()}`}>
          <span className="material-icons">{icon}</span>
        </div>
      </div>
    </div>
  );
}
