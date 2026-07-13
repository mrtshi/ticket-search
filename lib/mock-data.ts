export interface Ticket {
  ticketNumber: string;
  itemName: string;
  serialNumber: string;
  date: string;
  address: string;
  performer: string;
  status: string;
}

export const mockTickets: Ticket[] = [
  {
    ticketNumber: "TKT-001",
    itemName: "Холодильный шкаф Polair ШХ-1.4",
    serialNumber: "SN-10001",
    date: "15.01.2025",
    address: "г. Москва, ул. Ленина, д. 10",
    performer: "ИП Иванов",
    status: "В работе",
  },
  {
    ticketNumber: "TKT-002",
    itemName: "Морозильный ларь Polair МЛ-0.7",
    serialNumber: "SN-10002",
    date: "20.01.2025",
    address: "г. Санкт-Петербург, пр. Невский, д. 25",
    performer: "ООО Сервис",
    status: "Утвержден",
  },
  {
    ticketNumber: "TKT-003",
    itemName: "Сплит-система Polair СС-3.0",
    serialNumber: "SN-10003",
    date: "25.01.2025",
    address: "г. Казань, ул. Баумана, д. 5",
    performer: "ИП Петров",
    status: "Регистрация",
  },
  {
    ticketNumber: "TKT-004",
    itemName: "Витрина холодильная Polair ВХ-1.2",
    serialNumber: "SN-10004",
    date: "01.02.2025",
    address: "г. Екатеринбург, ул. Малышева, д. 50",
    performer: "ООО Ремонт",
    status: "В работе",
  },
  {
    ticketNumber: "TKT-005",
    itemName: "Холодильный шкаф Polair ШХ-0.7",
    serialNumber: "SN-10005",
    date: "05.02.2025",
    address: "г. Новосибирск, ул. Советская, д. 15",
    performer: "ИП Иванов",
    status: "Ожидание запчастей",
  },
  {
    ticketNumber: "TKT-006",
    itemName: "Морозильный ларь Polair МЛ-1.0",
    serialNumber: "SN-10006",
    date: "10.02.2025",
    address: "г. Самара, ул. Московская, д. 30",
    performer: "ООО Сервис",
    status: "Утвержден",
  },
  {
    ticketNumber: "TKT-007",
    itemName: "Сплит-система Polair СС-2.5",
    serialNumber: "SN-10007",
    date: "15.02.2025",
    address: "г. Ростов-на-Дону, ул. Большая Садовая, д. 45",
    performer: "ИП Петров",
    status: "В работе",
  },
];
