import React from 'react';
import { Grant } from '../types';
import { ExternalLink, Calendar, MapPin, DollarSign, Building } from 'lucide-react';
import clsx from 'clsx';

interface GrantCardProps {
  grant: Grant;
}

export const GrantCard: React.FC<GrantCardProps> = ({ grant }) => {
  return (
    <div className="group relative bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-100 group-hover:text-blue-400 transition-colors line-clamp-2">
            {grant.program_title}
            </h3>
            <div className="flex items-center gap-2 text-gray-400 mt-1">
                <Building size={14} />
                <span className="text-sm font-medium">{grant.agency_name}</span>
            </div>
        </div>
        <span className={clsx(
            "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider",
            grant.status === 'OPEN' ? "bg-green-500/20 text-green-400 border border-green-500/30" : 
            grant.status === 'UPCOMING' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
            "bg-gray-700 text-gray-400"
        )}>
            {grant.status}
        </span>
      </div>

      <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-1">
        {grant.brief_description}
      </p>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center gap-2 text-gray-300">
            <DollarSign size={14} className="text-emerald-500" />
            <span>{grant.funding_amount || "Amount not specified"}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
            <Calendar size={14} className="text-orange-500" />
            <span>Deadline: {grant.application_deadline || "Unknown"}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
            <MapPin size={14} className="text-purple-500" />
            <span>{grant.geographic_scope}</span>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-800 flex justify-between items-center">
        <span className="text-xs text-gray-600">
            Confidence: {(grant.confidence_score * 100).toFixed(0)}%
        </span>
        <a 
            href={grant.official_application_link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
            Apply Now <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
};
