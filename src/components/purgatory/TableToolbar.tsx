// /components/purgatory/TableToolbar.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  Calendar,
  Trash2,
  MoreVertical,
  FileClock,
  Tag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface TableToolbarProps {
  selectedCount: number;
  onSearch: (term: string) => void;
  onFilter: (filter: string) => void;
  onDateFilter: (date: string) => void;
  onBulkDelete: () => void;
  onBulkReschedule: () => void;
}

export function TableToolbar({
  selectedCount,
  onSearch,
  onFilter,
  onDateFilter,
  onBulkDelete,
  onBulkReschedule,
}: TableToolbarProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState<string[]>([]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  const addFilter = (filter: string) => {
    if (!activeFilters.includes(filter)) {
      const newFilters = [...activeFilters, filter];
      setActiveFilters(newFilters);
      onFilter(filter);
    }
  };

  const removeFilter = (filter: string) => {
    const newFilters = activeFilters.filter((f) => f !== filter);
    setActiveFilters(newFilters);
    onFilter(filter);
  };

  return (
    <div className="flex flex-col space-y-4 mb-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => addFilter("tweet")}>
                <FileClock className="mr-2 h-4 w-4" />
                <span>Tweets</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addFilter("thread")}>
                <Tag className="mr-2 h-4 w-4" />
                <span>Threads</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => addFilter("today")}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Today</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addFilter("week")}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>This Week</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{selectedCount} selected</Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={onBulkReschedule}
              className="text-blue-500 hover:text-blue-600"
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onBulkDelete}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge
              key={filter}
              variant="secondary"
              className="cursor-pointer hover:bg-gray-700"
              onClick={() => removeFilter(filter)}
            >
              {filter}
              <span className="ml-1">×</span>
            </Badge>
          ))}
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFilters([])}
              className="text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
