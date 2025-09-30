/**
 * Serviciu pentru gestionarea zilelor de sărbătoare legală din România
 * 
 * Acest serviciu oferă o listă cu toate zilele de sărbătoare legală din România
 * conform legislației în vigoare, conform Codului Muncii și hotărârilor de guvern.
 */

export class HolidayService {
  /**
   * Obține lista completă a sărbătorilor legale din România pentru anul curent
   * @returns Array de obiecte cu datele sărbătorilor legale
   */
  async getRomanianHolidays() {
    const currentYear = new Date().getFullYear();
    return this.getRomanianHolidaysForYear(currentYear);
  }

  /**
   * Obține lista completă a sărbătorilor legale din România pentru un an specificat
   * @param year Anul pentru care se doresc sărbătorile
   * @returns Array de obiecte cu datele sărbătorilor legale
   */
  async getRomanianHolidaysForYear(year: number) {
    // Zilele de sărbătoare legală conform Codului Muncii
    // Art. 139 din Codul Muncii (Legea 53/2003)
    const fixedHolidays = [
      { date: `${year}-01-01`, name: "Anul Nou" },
      { date: `${year}-01-02`, name: "A doua zi de Anul Nou" },
      { date: `${year}-01-24`, name: "Ziua Unirii Principatelor Române" },
      { date: `${year}-05-01`, name: "Ziua Muncii" },
      { date: `${year}-06-01`, name: "Ziua Copilului" },
      { date: `${year}-08-15`, name: "Adormirea Maicii Domnului" },
      { date: `${year}-11-30`, name: "Sfântul Andrei" },
      { date: `${year}-12-01`, name: "Ziua Națională a României" },
      { date: `${year}-12-25`, name: "Crăciunul" },
      { date: `${year}-12-26`, name: "A doua zi de Crăciun" }
    ];

    // Calculăm Paștele ortodox pentru anul curent
    const easterDate = this.calculateOrthodoxEaster(year);
    // Obținem data ca obiect Date
    const easterDay = new Date(easterDate);
    
    // A doua zi de Paște (Lunea de Paște)
    const easterMonday = new Date(easterDay);
    easterMonday.setDate(easterDay.getDate() + 1);
    
    // Vinerea Mare (Vinerea din Săptămâna Mare)
    const goodFriday = new Date(easterDay);
    goodFriday.setDate(easterDay.getDate() - 2);

    // Rusaliile (la 50 de zile după Paște)
    const pentecostDay = new Date(easterDay);
    pentecostDay.setDate(easterDay.getDate() + 49);

    // A doua zi de Rusalii
    const pentecostMonday = new Date(pentecostDay);
    pentecostMonday.setDate(pentecostDay.getDate() + 1);

    // Formatăm datele mobile pentru a le adăuga la lista finală
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
    };

    const mobileHolidays = [
      { date: formatDate(goodFriday), name: "Vinerea Mare" },
      { date: formatDate(easterDay), name: "Paștele ortodox" },
      { date: formatDate(easterMonday), name: "A doua zi de Paște" },
      { date: formatDate(pentecostDay), name: "Rusaliile" },
      { date: formatDate(pentecostMonday), name: "A doua zi de Rusalii" }
    ];

    // Combinăm sărbătorile fixe cu cele mobile și le sortăm cronologic
    const allHolidays = [...fixedHolidays, ...mobileHolidays].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return allHolidays;
  }

  /**
   * Calculează data Paștelui ortodox pentru un an specificat
   * Implementează algoritmul Gauss pentru calculul datei Paștelui ortodox
   * 
   * @param year Anul pentru care se calculează Paștele
   * @returns Data Paștelui ortodox în format ISO (YYYY-MM-DD)
   */
  private calculateOrthodoxEaster(year: number): string {
    // Algoritmul Gauss pentru calculul Paștelui ortodox
    const a = year % 19;
    const b = year % 7;
    const c = year % 4;
    
    const d = (19 * a + 16) % 30;
    const e = (2 * c + 4 * b + 6 * d) % 7;
    const f = (19 * a + 16) % 30;
    
    const key = f + e;
    
    let month: number, day: number;
    
    if (key <= 9) {
      month = 4;
      day = 4 + key;
    } else {
      month = 5;
      day = key - 9;
    }
    
    // Formula calculată conform calendarului iulian
    // Pentru calendarul gregorian (folosit în România), adăugăm 13 zile pentru secolul 21
    const juliansDate = new Date(year, month - 1, day);
    juliansDate.setDate(juliansDate.getDate() + 13);
    
    // Formăm data în format ISO
    const isoDate = juliansDate.toISOString().split('T')[0];
    return isoDate;
  }
}