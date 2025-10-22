import React from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

// Definim interfața pentru employee bazată pe structura tabelei employees din schema HR
interface Employee {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  cnp?: string;
  idSeriesNumber?: string;
  address?: string;
  city?: string;
  county?: string;
  phone?: string;
  position?: string;
}

interface AccountTermsTemplateProps {
  employee: Partial<Employee>;
  companyName: string;
}

const AccountTermsTemplate: React.FC<AccountTermsTemplateProps> = ({ 
  employee, 
  companyName = "Compania Dumneavoastră SRL" 
}) => {
  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: ro });
  
  return (
    <div className="p-6 max-w-4xl mx-auto bg-white text-slate-900 border rounded-lg shadow-sm">
      <h1 className="text-center text-xl font-bold mb-6">ACORD PRIVIND UTILIZAREA SISTEMELOR INFORMATICE ȘI DE COMUNICARE</h1>
      
      <p className="mb-4 text-sm">
        Subsemnatul/Subsemnata <span className="font-medium">{employee.lastName} {employee.firstName}</span>,
        CNP <span className="font-medium">{employee.cnp || '_________________'}</span>, 
        în calitate de angajat(ă) al/a <span className="font-medium">{companyName}</span>,
      </p>
      
      <p className="mb-4 text-sm">
        Declar că am fost informat(ă) și sunt de acord cu următoarele condiții privind utilizarea contului de utilizator și a sistemelor informatice ale companiei:
      </p>
      
      <h2 className="text-lg font-semibold mt-6 mb-3">1. Scopul accesului în sistemele informatice</h2>
      <p className="mb-4 text-sm">
        Înțeleg că mi se va crea un cont de utilizator în sistemele informatice ale companiei <span className="font-medium">{companyName}</span>, destinat exclusiv utilizării profesionale în cadrul activităților mele de serviciu.
      </p>
      
      <h2 className="text-lg font-semibold mt-4 mb-3">2. Confidențialitatea credențialelor</h2>
      <p className="mb-4 text-sm">
        Mă angajez să păstrez confidențialitatea credențialelor de acces (nume utilizator și parolă) și să nu le divulg altor persoane. Înțeleg că sunt responsabil(ă) pentru toate acțiunile efectuate prin contul meu.
      </p>
      
      <h2 className="text-lg font-semibold mt-4 mb-3">3. Utilizarea acceptabilă</h2>
      <ul className="list-disc pl-8 mb-4 text-sm">
        <li>Voi utiliza sistemele informatice ale companiei doar pentru îndeplinirea sarcinilor profesionale;</li>
        <li>Nu voi utiliza contul pentru activități ilegale, frauduloase sau care încalcă politicile companiei;</li>
        <li>Voi respecta toate politicile de securitate informatică implementate de companie;</li>
        <li>Nu voi încerca să accesez informații pentru care nu am autorizare;</li>
        <li>Nu voi instala software neautorizat pe echipamentele companiei;</li>
        <li>Voi raporta imediat orice activitate suspectă sau brecă de securitate.</li>
      </ul>
      
      <h2 className="text-lg font-semibold mt-4 mb-3">4. Monitorizarea și confidențialitatea datelor</h2>
      <p className="mb-4 text-sm">
        Înțeleg și accept că:
      </p>
      <ul className="list-disc pl-8 mb-4 text-sm">
        <li>Compania poate monitoriza utilizarea sistemelor informatice în conformitate cu legislația aplicabilă;</li>
        <li>Nu trebuie să am așteptări de confidențialitate privind utilizarea resurselor informatice ale companiei;</li>
        <li>Datele și comunicările efectuate prin sistemele companiei pot fi accesate și verificate de persoanele autorizate;</li>
        <li>Monitorizarea se realizează pentru asigurarea securității informatice și verificarea respectării politicilor companiei.</li>
      </ul>
      
      <h2 className="text-lg font-semibold mt-4 mb-3">5. Protecția datelor confidențiale</h2>
      <p className="mb-4 text-sm">
        Mă angajez să protejez datele confidențiale ale companiei și să nu divulg informații confidențiale (inclusiv cele ale clienților, furnizorilor sau partenerilor de afaceri) către persoane neautorizate.
      </p>
      
      <h2 className="text-lg font-semibold mt-4 mb-3">6. Încetarea accesului</h2>
      <p className="mb-4 text-sm">
        Înțeleg că accesul la sistemele informatice ale companiei va înceta la terminarea raporturilor de muncă sau în cazul încălcării prezentului acord sau a politicilor companiei.
      </p>
      
      <h2 className="text-lg font-semibold mt-4 mb-3">7. Actualizarea politicilor</h2>
      <p className="mb-4 text-sm">
        Accept că politicile companiei privind utilizarea sistemelor informatice pot fi actualizate periodic și mă angajez să respect versiunile actualizate ale acestora.
      </p>
      
      <p className="mb-6 text-sm mt-6">
        Confirm că am citit și am înțeles conținutul prezentului acord și mă angajez să respect toate condițiile menționate.
      </p>
      
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <p className="text-sm font-medium">Data: {currentDate}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Semnătura:</p>
          <div className="mt-2 border-b border-slate-400 w-full">&nbsp;</div>
        </div>
      </div>
    </div>
  );
};

export default AccountTermsTemplate;