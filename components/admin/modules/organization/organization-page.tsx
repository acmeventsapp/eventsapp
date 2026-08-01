"use client";

import PageBreadcrumb from "@/components/admin/header/pagebreadcrumb";
import PageHeader from "@/components/admin/header/pageHeader";
import ArchdeaconryForm from "@/components/admin/modules/organization/archdeaconry-form";
import BranchManager from "@/components/admin/modules/organization/branch-manager";
import UnitManager from "@/components/admin/modules/organization/unit-manager";
import ZoneManager from "@/components/admin/modules/organization/zone-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OrganizationPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <PageBreadcrumb />
      <PageHeader
        title="Organization"
        description="Manage the Archdeaconry hierarchy: Zones, Units, and Branches used in registration forms."
      />

      <Tabs defaultValue="archdeaconry" className="w-full">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="archdeaconry">Archdeaconry</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
        </TabsList>

        <TabsContent value="archdeaconry">
          <ArchdeaconryForm />
        </TabsContent>
        <TabsContent value="zones">
          <ZoneManager />
        </TabsContent>
        <TabsContent value="units">
          <UnitManager />
        </TabsContent>
        <TabsContent value="branches">
          <BranchManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
