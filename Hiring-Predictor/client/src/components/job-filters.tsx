import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface JobFiltersProps {
    searchValue: string;
    levelValue: string;
    companyTypeValue: string;
    companySizeValue: string;
    onSearchChange: (value: string) => void;
    onLevelChange: (value: string) => void;
    onCompanyTypeChange: (value: string) => void;
    onCompanySizeChange?: (value: string) => void;
    onReset: () => void;
}

export function JobFilters({
    searchValue,
    levelValue,
    companyTypeValue,
    companySizeValue,
    onSearchChange,
    onLevelChange,
    onCompanyTypeChange,
    onCompanySizeChange,
    onReset
}: JobFiltersProps) {
    return (
        <div className="space-y-4 mb-8">
            {/* Search Bar */}
            <div className="relative max-w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by role, company name, or skills (e.g. React, Manager)..."
                    className="pl-10 h-12 text-lg shadow-sm"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap gap-4">

                {/* Experience Level */}
                <Select value={levelValue || "all"} onValueChange={(val) => onLevelChange(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Experience Level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="Student">Intern / Student</SelectItem>
                        <SelectItem value="Junior">Entry / Junior</SelectItem>
                        <SelectItem value="Mid">Mid Level</SelectItem>
                        <SelectItem value="Senior">Senior / Lead</SelectItem>
                    </SelectContent>
                </Select>

                {/* Company Type */}
                <Select value={companyTypeValue || "all"} onValueChange={(val) => onCompanyTypeChange(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Company Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Startup">Startup / High Growth</SelectItem>
                        <SelectItem value="MNC">MNC / Enterprise</SelectItem>
                        <SelectItem value="Product">Product-based</SelectItem>
                    </SelectContent>
                </Select>

                {/* Company Size */}
                <Select value={companySizeValue || "all"} onValueChange={(val) => onCompanySizeChange?.(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Company Size" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Any Size</SelectItem>
                        <SelectItem value="Startup">Early-stage (1-50)</SelectItem>
                        <SelectItem value="Small">Small (51-200)</SelectItem>
                        <SelectItem value="Mid-size">Mid-size (201-1000)</SelectItem>
                        <SelectItem value="Large">Enterprise (1000+)</SelectItem>
                    </SelectContent>
                </Select>

                {/* Reset */}
                <Button variant="ghost" onClick={onReset} className="text-muted-foreground hover:text-foreground">
                    Reset Filters
                </Button>
            </div>
        </div>
    );
}
