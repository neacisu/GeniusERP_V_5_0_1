/**
 * Edit Invoice Page
 * 
 * Edit an existing invoice with updated items, customer, and pricing.
 */

import React from "react";
import PageHeader from "../../../components/common/PageHeader";

interface EditInvoicePageProps {
  id: string;
}

const EditInvoicePage: React.FC<EditInvoicePageProps> = ({ id }) => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Editare factură" 
        description={`Editare factură #${id}`}
      />
      <div className="rounded-lg border border-dashed p-8 text-center">
        <h3 className="text-lg font-medium mb-2">Pagină în dezvoltare</h3>
        <p className="text-muted-foreground">
          Această funcționalitate va fi disponibilă în curând.
        </p>
      </div>
    </div>
  );
};

export default EditInvoicePage;