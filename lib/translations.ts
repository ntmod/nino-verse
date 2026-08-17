export type Language = "en" | "th";

export const translations = {
  en: {
    // Navigation
    nav_home: "Home",
    nav_notes: "Notes",
    nav_analytics: "Analytics",
    nav_settings: "Settings",
    nav_logout: "Logout",
    nav_toggle_theme: "Toggle theme",
    nav_language: "Language",

    // Dashboard Total Spent Card
    total_spent: "TOTAL SPENT",
    vs_prev_period: "VS PREV PERIOD",
    target_budget: "TARGET BUDGET",
    under_budget: "UNDER BUDGET",
    over_budget: "OVER BUDGET",
    remaining: "REMAINING",
    budget_used: "USED",

    // Daily Average Card
    daily_average: "DAILY AVERAGE",
    today: "TODAY",
    est_cycle_end: "EST. CYCLE END",
    by_category: "BY CATEGORY",
    limits_check: "LIMITS CHECK",
    over_limit: "OVER LIMIT",
    healthy_limit: "HEALTHY",
    configure_daily_avg: "Configure daily average categories",

    // Fixed Costs Card
    fixed_costs: "FIXED COSTS",
    reset: "RESET",
    paid: "PAID",
    unpaid: "UNPAID",
    all_paid: "ALL PAID",
    total_fixed: "TOTAL FIXED",

    // Payment Methods Card
    payment_methods: "PAYMENT METHODS",
    total_tracked: "TOTAL TRACKED",

    // Budget List Card
    category_budgets: "CATEGORY BUDGETS",
    limit: "Limit",
    left: "left",
    over: "over",

    // Recent Transactions Card
    recent_transactions: "RECENT TRANSACTIONS",
    no_recent_transactions: "No transactions yet this cycle",
    view_all: "VIEW ALL",
    delete: "Delete",
    edit: "Edit",

    // Expense Pie Chart
    expense_breakdown: "EXPENSE BREAKDOWN",
    no_expense_data: "No expense data for this period",

    // Expense Modal
    add_expense: "Add Expense",
    edit_expense: "Edit Expense",
    expense_name: "Title / Name",
    expense_name_placeholder: "e.g. Lunch with friends",
    amount: "Amount",
    amount_placeholder: "0.00",
    category: "Category",
    select_category: "Select Category",
    subcategory: "Sub Category",
    select_subcategory: "Select Sub Category (Optional)",
    payment_method: "Payment Method",
    select_payment_method: "Select Payment Method",
    date: "Date",
    save_expense: "Save Expense",
    update_expense: "Update Expense",
    cancel: "Cancel",
    confirm_delete: "Confirm Delete",
    delete_prompt: "Are you sure you want to delete this transaction?",

    // Global Modal
    reset_fixed_costs_header: "Reset Fixed Costs",
    reset_fixed_costs_msg: "Are you sure you want to reset the payment status of all fixed costs for this month?",
    confirm_reset: "Confirm Reset",
    reset_completed_header: "Reset Completed",
    reset_completed_msg: "Payment status of all fixed costs has been successfully reset.",
    close: "Close",

    // Notes Page
    notes_title: "Notes & Records",
    notes_subtitle: "Manage your quick notes and reminders",
    add_note: "Add Note",
    note_placeholder: "Write your note here...",

    // Analytics Page
    analytics_title: "Financial Analytics",
    analytics_subtitle: "Comprehensive insights on your spending habits",

    // Settings Page
    settings_title: "Systems Settings",
    settings_subtitle: "Configure your expense tracking environment",
    settings_categories: "Categories",
    settings_categories_desc: "Manage your spending categories and icons",
    settings_methods: "Payment Methods",
    settings_methods_desc: "Link card, cash, or digital wallets",
    settings_budgets: "Budgets",
    settings_budgets_desc: "Set monthly limits per category",
    settings_fixed_costs: "Fixed Costs",
    settings_fixed_costs_desc: "Manage recurring bills and subscriptions",
    settings_daily_avg: "Daily Average",
    settings_daily_avg_desc: "Select categories to calculate daily average",
    settings_language: "Language",
    settings_language_desc: "Switch between English and Thai",

    // General
    loading: "Loading...",
    currency: "THB",
    day: "day",
    month: "month",
    all: "All",
    back: "Back",
  },
  th: {
    // Navigation
    nav_home: "หน้าแรก",
    nav_notes: "บันทึก",
    nav_analytics: "วิเคราะห์",
    nav_settings: "ตั้งค่า",
    nav_logout: "ออกจากระบบ",
    nav_toggle_theme: "เปลี่ยนธีม",
    nav_language: "ภาษา",

    // Dashboard Total Spent Card
    total_spent: "ยอดใช้จ่ายทั้งหมด",
    vs_prev_period: "เทียบกับรอบก่อน",
    target_budget: "งบประมาณเป้าหมาย",
    under_budget: "ยังอยู่ในงบ",
    over_budget: "เกินงบประมาณ",
    remaining: "คงเหลือ",
    budget_used: "ใช้ไป",

    // Daily Average Card
    daily_average: "เฉลี่ยรายวัน",
    today: "วันนี้",
    est_cycle_end: "คาดการณ์สิ้นรอบ",
    by_category: "ตามหมวดหมู่",
    limits_check: "ตรวจสอบลิมิต",
    over_limit: "เกินลิมิต",
    healthy_limit: "ปกติ",
    configure_daily_avg: "ตั้งค่าหมวดหมู่เฉลี่ยรายวัน",

    // Fixed Costs Card
    fixed_costs: "ค่าใช้จ่ายประจำ",
    reset: "รีเซ็ต",
    paid: "จ่ายแล้ว",
    unpaid: "ยังไม่จ่าย",
    all_paid: "จ่ายครบแล้ว",
    total_fixed: "รวมค่าใช้จ่ายประจำ",

    // Payment Methods Card
    payment_methods: "วิธีการชำระเงิน",
    total_tracked: "ยอดรวมที่บันทึก",

    // Budget List Card
    category_budgets: "งบประมาณตามหมวดหมู่",
    limit: "ลิมิต",
    left: "เหลือ",
    over: "เกิน",

    // Recent Transactions Card
    recent_transactions: "รายการล่าสุด",
    no_recent_transactions: "ยังไม่มีรายการในรอบบิลนี้",
    view_all: "ดูทั้งหมด",
    delete: "ลบ",
    edit: "แก้ไข",

    // Expense Pie Chart
    expense_breakdown: "สัดส่วนค่าใช้จ่าย",
    no_expense_data: "ไม่มีข้อมูลค่าใช้จ่ายในรอบนี้",

    // Expense Modal
    add_expense: "บันทึกค่าใช้จ่าย",
    edit_expense: "แก้ไขค่าใช้จ่าย",
    expense_name: "ชื่อรายการ",
    expense_name_placeholder: "เช่น ข้าวกลางวัน, กาแฟ",
    amount: "จำนวนเงิน",
    amount_placeholder: "0.00",
    category: "หมวดหมู่",
    select_category: "เลือกหมวดหมู่",
    subcategory: "หมวดหมู่ย่อย",
    select_subcategory: "เลือกหมวดหมู่ย่อย (ระบุหรือไม่ก็ได้)",
    payment_method: "วิธีชำระเงิน",
    select_payment_method: "เลือกวิธีชำระเงิน",
    date: "วันที่",
    save_expense: "บันทึกข้อมูล",
    update_expense: "อัปเดตข้อมูล",
    cancel: "ยกเลิก",
    confirm_delete: "ยืนยันการลบ",
    delete_prompt: "คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?",

    // Global Modal
    reset_fixed_costs_header: "รีเซ็ตค่าใช้จ่ายประจำ",
    reset_fixed_costs_msg: "คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตสถานะการจ่ายของค่าใช้จ่ายประจำทั้งหมดสำหรับเดือนนี้?",
    confirm_reset: "ยืนยันการรีเซ็ต",
    reset_completed_header: "รีเซ็ตเรียบร้อย",
    reset_completed_msg: "สถานะการจ่ายของค่าใช้จ่ายประจำทั้งหมดได้รับการรีเซ็ตแล้ว",
    close: "ปิด",

    // Notes Page
    notes_title: "บันทึกและข้อความ",
    notes_subtitle: "จัดการบันทึกด่วนและสิ่งที่ต้องจำ",
    add_note: "เพิ่มบันทึก",
    note_placeholder: "เขียนบันทึกของคุณที่นี่...",

    // Analytics Page
    analytics_title: "การวิเคราะห์ทางการเงิน",
    analytics_subtitle: "ข้อมูลเชิงลึกเกี่ยวกับพฤติกรรมการใช้จ่ายของคุณ",

    // Settings Page
    settings_title: "การตั้งค่าระบบ",
    settings_subtitle: "กำหนดค่าระบบการติดตามค่าใช้จ่ายของคุณ",
    settings_categories: "หมวดหมู่",
    settings_categories_desc: "จัดการหมวดหมู่ค่าใช้จ่ายและไอคอน",
    settings_methods: "วิธีการชำระเงิน",
    settings_methods_desc: "จัดการบัตร เงินสด หรือกระเป๋าเงินดิจิทัล",
    settings_budgets: "งบประมาณ",
    settings_budgets_desc: "กำหนดวงเงินรายเดือนในแต่ละหมวดหมู่",
    settings_fixed_costs: "ค่าใช้จ่ายประจำ",
    settings_fixed_costs_desc: "จัดการบิลรายเดือนและค่าสมาชิกต่างๆ",
    settings_daily_avg: "ค่าเฉลี่ยรายวัน",
    settings_daily_avg_desc: "เลือกหมวดหมู่เพื่อคำนวณค่าเฉลี่ยรายวัน",
    settings_language: "ภาษา (Language)",
    settings_language_desc: "สลับระหว่างภาษาไทยและภาษาอังกฤษ",

    // General
    loading: "กำลังโหลด...",
    currency: "THB",
    day: "วัน",
    month: "เดือน",
    all: "ทั้งหมด",
    back: "ย้อนกลับ",
  }
};

export type TranslationKey = keyof typeof translations.en;
