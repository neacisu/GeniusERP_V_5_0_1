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

interface GdprConsentTemplateProps {
  employee: Partial<Employee>;
  companyName: string;
}

const GdprConsentTemplate: React.FC<GdprConsentTemplateProps> = ({ 
  employee, 
  companyName = "Compania Dumneavoastră SRL" 
}) => {
  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: ro });
  
  return (
    <div className="p-6 max-w-4xl mx-auto bg-white text-slate-900 border rounded-lg shadow-sm">
      <h1 className="text-center text-xl font-bold mb-6">CONSIMȚĂMÂNT PRIVIND PRELUCRAREA DATELOR CU CARACTER PERSONAL</h1>
      
      <p className="mb-4 text-sm">
        Subsemnatul/Subsemnata <span className="font-medium">{employee.lastName} {employee.firstName}</span>,
        CNP <span className="font-medium">{employee.cnp || '_________________'}</span>, 
        posesor/posesoare al/a C.I. seria <span className="font-medium">{employee.idSeriesNumber?.split(' ')[0] || '___'}</span> 
        nr. <span className="font-medium">{employee.idSeriesNumber?.split(' ')[1] || '_______'}</span>, 
        domiciliat(ă) în <span className="font-medium">{employee.address || '___________________'}</span>,
        în calitate de angajat(ă) al/a <span className="font-medium">{companyName}</span>,
      </p>
      
      <p className="mb-4 text-sm">
        Declar prin prezenta că sunt de acord ca <span className="font-medium">{companyName}</span>, să colecteze, să stocheze și să prelucreze datele mele cu caracter personal în conformitate cu Regulamentul (UE) 2016/679 privind protecția persoanelor fizice în ceea ce privește prelucrarea datelor cu caracter personal și privind libera circulație a acestor date ("GDPR"), în următoarele scopuri:
      </p>
      
      <ul className="list-disc pl-8 mb-4 text-sm">
        <li>Gestionarea contractului meu de muncă și a relației de muncă;</li>
        <li>Îndeplinirea obligațiilor legale ale angajatorului față de autoritățile publice (evidențe fiscale, administrație, securitate socială, etc.);</li>
        <li>Administrarea dosarului personal de angajat și a situațiilor aferente;</li>
        <li>Calculul și plata salariului, precum și a altor drepturi salariale;</li>
        <li>Înregistrarea și transmiterea datelor în Registrul General de Evidență a Salariaților (REVISAL);</li>
        <li>Asigurarea securității și sănătății în muncă;</li>
        <li>Comunicări interne și administrarea accesului în sistemele informatice ale companiei;</li>
        <li>Evaluarea performanțelor profesionale și dezvoltarea carierei;</li>
        <li>Exercitarea altor drepturi și îndeplinirea altor obligații prevăzute de legislația muncii.</li>
      </ul>
      
      <p className="mb-4 text-sm">
        Înțeleg că prelucrarea datelor mele cu caracter personal se realizează în mod legal, echitabil și transparent, strict în scopurile pentru care au fost colectate, cu asigurarea unor măsuri tehnice și organizatorice adecvate pentru protejarea securității acestora.
      </p>
      
      <p className="mb-4 text-sm">
        Am fost informat(ă) că datele mele pot fi transmise, conform obligațiilor legale sau în scopul îndeplinirii obligațiilor contractuale, către: autoritățile fiscale, Casa Națională de Pensii Publice, Casa Națională de Asigurări de Sănătate, Agenția Națională pentru Ocuparea Forței de Muncă, Inspectoratul Teritorial de Muncă, societăți de asigurări private de sănătate, furnizori de servicii de medicina muncii, instituții financiar-bancare pentru plata salariilor, și alți parteneri contractuali ai angajatorului necesari pentru desfășurarea activității.
      </p>
      
      <p className="mb-4 text-sm">
        Am fost informat(ă) că, în conformitate cu GDPR, beneficiez de următoarele drepturi:
      </p>
      
      <ul className="list-disc pl-8 mb-4 text-sm">
        <li>Dreptul de acces la datele prelucrate;</li>
        <li>Dreptul la rectificarea datelor inexacte;</li>
        <li>Dreptul la ștergerea datelor ("dreptul de a fi uitat");</li>
        <li>Dreptul la restricționarea prelucrării;</li>
        <li>Dreptul la portabilitatea datelor;</li>
        <li>Dreptul la opoziție;</li>
        <li>Dreptul de a nu face obiectul unei decizii bazate exclusiv pe prelucrarea automată, inclusiv crearea de profiluri;</li>
        <li>Dreptul de a depune o plângere în fața Autorității Naționale de Supraveghere a Prelucrării Datelor cu Caracter Personal.</li>
      </ul>
      
      <p className="mb-6 text-sm">
        Înțeleg că retragerea consimțământului pentru prelucrările de date bazate pe consimțământ nu afectează legalitatea prelucrării efectuate până la acel moment și nici prelucrările efectuate în baza altor temeiuri legale.
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

export default GdprConsentTemplate;