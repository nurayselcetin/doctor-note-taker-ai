let currentPatientId = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingTimerInterval = null;
window.currentSortOrder = 'desc'; // Default Sort
let currentLanguage = localStorage.getItem('language') || 'tr';
const token = localStorage.getItem('token');

const TRANSLATIONS = {
    'tr': {
        'new_patient': 'Yeni Hasta',
        'patients_title': 'HASTALAR',
        'search_placeholder': 'Ara: İsim, tanı, il...',
        'dark_mode': 'Gece Modu',
        'assistant_mode': 'Asistan Modu',
        'random_case': 'Rastgele Vaka Oluştur',
        'history_summary_btn': 'Geçmişi Özetle',
        'no_patient_header': 'Soldan bir hasta seçin',
        'empty_state_title': 'Kayıt almak için bir hasta seçin',
        'empty_state_subtitle': 'veya yeni bir hasta kartı oluşturun.',
        'welcome_title': 'MedNote Asistan',
        'welcome_subtitle': 'Görüşme notlarınız otomatik olarak analiz ediliyor.',
        'history_summary_title': 'Genel Durum Özeti',
        'recording_title': 'Yeni Görüşme Kaydı',
        'record_start': 'Kaydı Başlat',
        'record_stop': 'Kaydı Bitir',
        'processing': 'Yapay zeka analiz ediyor...',
        'past_notes_title': 'Geçmiş Görüşmeler',
        'new': 'Yeni',
        'old': 'Eski',
        'transcription_label': 'Görüşme Metni',
        'ai_analysis_label': 'AI Analizi',
        'analyze_btn': 'AI ile Analiz Et',
        'analyzing': 'Özetleniyor...',
        'student_notes_title': 'ASİSTANA ÖZEL NOTLAR',
        'assistant_feedback_title': 'Asistan Görüşleri & Tartışma',
        'send': 'Gönder',
        'cancel': 'İptal',
        'save': 'Kaydet',
        'risk_critical': 'ACİL DURUM',
        'risk_warning': 'RİSK UYARISI',
        'clinical_notes_title': 'KLİNİK LİTERATÜR NOTLARI (AI)',
        'disclaimer': 'Bu öneriler tanı veya tedavi tavsiyesi değildir. Yalnızca araştırma amaçlıdır.',
        'toast_deleted': 'Not silindi.',
        'toast_saved': 'Not başarıyla kaydedildi.',
        'toast_updated': 'Not güncellendi.',
        'toast_summary_ok': 'Not özetlendi.',
        'education_warning': '⚠️ Kısıtlı Asistan Modu Aktif. Yeni hasta girişi kapatıldı.',
        'admin_mode': '✅ Yönetici girişi doğrulandı. Normal moda dönüldü.',
        'confirm_delete_note': 'Bu notu silmek istediğinize emin misiniz?',
        'confirm_delete_patient': 'isimli hastayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm notları silinir.',

        // Modal Translations
        'modal_new_patient_title': 'Hasta Kaydı',
        'modal_label_name': 'AD SOYAD',
        'modal_btn_cancel': 'İptal',
        'modal_btn_continue': 'Devam Et',
        'modal_text_checking': 'Kayıtlar kontrol ediliyor...',
        'modal_text_duplicates': 'Bu isimle birden fazla kayıt bulundu.',
        'modal_text_select': 'Doğru hastayı seçin:',
        'modal_text_other_options': 'DİĞER SEÇENEKLER',
        'modal_btn_have_code': 'Kodum Var',
        'modal_btn_new_record': 'Yeni Kayıt Aç',
        'modal_btn_back': 'Geri',
        'modal_label_code': 'HASTA TANIMLAYICI KODU',
        'modal_btn_open_file': 'Hasta Dosyasını Aç',

        // Additional UI Elements
        'pdf_download': 'PDF İndir',
        'logout': 'Çıkış Yap'
    },
    'en': {
        'new_patient': 'New Patient',
        'patients_title': 'PATIENTS',
        'search_placeholder': 'Search: Name, diagnosis...',
        'dark_mode': 'Dark Mode',
        'assistant_mode': 'Assistant Mode',
        'random_case': 'Generate Random Case',
        'history_summary_btn': 'Summarize History',
        'no_patient_header': 'Select a patient from the left',
        'empty_state_title': 'Select a patient to record',
        'empty_state_subtitle': 'or create a new patient card.',
        'welcome_title': 'MedNote Assistant',
        'welcome_subtitle': 'Your consultation notes are automatically analyzed.',
        'history_summary_title': 'General Status Summary',
        'recording_title': 'New Consultation Record',
        'record_start': 'Start Recording',
        'record_stop': 'Stop Recording',
        'processing': 'AI is analyzing...',
        'past_notes_title': 'Past Consultations',
        'new': 'New',
        'old': 'Old',
        'transcription_label': 'Transcription',
        'ai_analysis_label': 'AI Analysis',
        'analyze_btn': 'Analyze with AI',
        'analyzing': 'Summarizing...',
        'student_notes_title': 'NOTES FOR RESIDENTS',
        'assistant_feedback_title': 'Resident Feedback & Discussion',
        'send': 'Send',
        'cancel': 'Cancel',
        'save': 'Save',
        'risk_critical': 'EMERGENCY',
        'risk_warning': 'RISK WARNING',
        'clinical_notes_title': 'CLINICAL LITERATURE NOTES (AI)',
        'disclaimer': 'These suggestions are not diagnosis or treatment advice. For research purposes only.',
        'toast_deleted': 'Note deleted.',
        'toast_saved': 'Note saved successfully.',
        'toast_updated': 'Note updated.',
        'toast_summary_ok': 'Note summarized.',
        'education_warning': '⚠️ Restricted Assistant Mode Active. New patient entry disabled.',
        'admin_mode': '✅ Admin login verified. Returned to normal mode.',
        'confirm_delete_note': 'Are you sure you want to delete this note?',
        'confirm_delete_patient': 'Are you sure you want to delete patient? This cannot be undone.',

        // Modal Translations
        'modal_new_patient_title': 'New Patient Registration',
        'modal_label_name': 'NAME SURNAME',
        'modal_btn_cancel': 'Cancel',
        'modal_btn_continue': 'Continue',
        'modal_text_checking': 'Checking records...',
        'modal_text_duplicates': 'Multiple records found with this name.',
        'modal_text_select': 'Select the correct patient:',
        'modal_text_other_options': 'OTHER OPTIONS',
        'modal_btn_have_code': 'I Have Code',
        'modal_btn_new_record': 'Create New Record',
        'modal_btn_back': 'Back',
        'modal_label_code': 'PATIENT IDENTIFIER CODE',
        'modal_btn_open_file': 'Open Patient File',

        // Additional UI Elements
        'pdf_download': 'Download PDF',
        'logout': 'Logout'
    }
};

function t(key) {
    return TRANSLATIONS[currentLanguage][key] || key;
}

// Safe date formatting helper to prevent locale-related errors
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }

        // Use simplified locale codes without region to avoid browser compatibility issues
        const locale = currentLanguage === 'en' ? 'en' : 'tr';
        return date.toLocaleString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        // Fallback to manual formatting if toLocaleString fails
        const date = new Date(dateString);
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
}

function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updateUI();

    if (currentPatientId) {
        loadNotes(currentPatientId);

        // Auto-regenerate history summary if it's currently visible
        const summaryCard = document.getElementById('history-summary-card');
        if (summaryCard && !summaryCard.classList.contains('hidden')) {
            // Trigger summary generation in the new language
            summarizeHistory();
        }
    }
}

function updateUI() {
    // Helper to safe update text
    const setTxt = (id, key) => {
        const el = document.getElementById(id);
        if (el) el.innerText = t(key);
    };

    // Update Language Select Value
    const langSelect = document.getElementById('language-select');
    if (langSelect) langSelect.value = currentLanguage;

    // Sidebar
    // New Patient Button (icon + text)
    const newPatientBtn = document.getElementById('new-patient-btn');
    if (newPatientBtn) newPatientBtn.innerHTML = `<i class="fa-solid fa-plus"></i> ${t('new_patient')}`;

    // Sidebar Titles & Toggles
    setTxt('sidebar-patients-title', 'patients_title');
    setTxt('settings-dark-mode', 'dark_mode');
    setTxt('settings-assistant-mode', 'assistant_mode');

    // AI Case Btn (Inside span)
    setTxt('btn-random-case', 'random_case');

    // Search
    const searchInput = document.getElementById('patient-search-input');
    if (searchInput) searchInput.placeholder = t('search_placeholder');

    // Headers
    setTxt('header-no-patient', 'no_patient_header');

    const summaryBtnText = document.getElementById('btn-history-summary-text');
    if (summaryBtnText) summaryBtnText.innerText = t('history_summary_btn');

    // Empty state
    setTxt('empty-state-title', 'empty_state_title');
    setTxt('empty-state-subtitle', 'empty_state_subtitle');

    // Welcome
    setTxt('welcome-title', 'welcome_title');
    setTxt('welcome-subtitle', 'welcome_subtitle');
    setTxt('history-summary-title', 'history_summary_title');

    // Recording Area
    const recordStatus = document.getElementById('record-status');
    const timer = document.getElementById('recording-timer');
    // Only update if not currently recording (timer hidden)
    if (timer && timer.classList.contains('hidden') && recordStatus) {
        recordStatus.innerText = t('record_start');
    }

    const recTitle = document.querySelector('#recording-area h3');
    if (recTitle) recTitle.innerText = t('recording_title');

    // Titles
    const pastNotesTitle = document.querySelector('#patient-dashboard h3.text-xl'); // "Geçmiş Görüşmeler"
    if (pastNotesTitle) pastNotesTitle.innerText = t('past_notes_title');

    // Sort Buttons
    const btnDesc = document.getElementById('sort-desc-btn');
    if (btnDesc) btnDesc.innerHTML = `<i class="fa-solid fa-arrow-down-short-wide"></i> ${t('new')}`;
    const btnAsc = document.getElementById('sort-asc-btn');
    if (btnAsc) btnAsc.innerHTML = `<i class="fa-solid fa-arrow-up-wide-short"></i> ${t('old')}`;

    // Modal Translations
    setTxt('modal-new-patient-title', 'modal_new_patient_title');
    setTxt('modal-label-name', 'modal_label_name');
    setTxt('modal-btn-cancel', 'modal_btn_cancel');
    setTxt('modal-btn-continue', 'modal_btn_continue');
    setTxt('modal-text-checking', 'modal_text_checking');
    // For duplicate text with icon, we need innerHTML safe update or just text
    // The duplicate msg has an icon. Let's just update the text node if possible or recreate.
    // simpler:
    const dupMsg = document.getElementById('modal-text-duplicates');
    if (dupMsg) dupMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${t('modal_text_duplicates')}`;

    setTxt('modal-text-select', 'modal_text_select');
    setTxt('modal-text-other-options', 'modal_text_other_options');
    setTxt('modal-btn-have-code', 'modal_btn_have_code');
    setTxt('modal-btn-new-record', 'modal_btn_new_record');
    setTxt('modal-btn-back', 'modal_btn_back');
    setTxt('modal-label-code', 'modal_label_code');
    setTxt('modal-btn-open-file', 'modal_btn_open_file');
}


// Initialization
document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Setup Logout
    const logoutBtn = document.createElement('button');
    logoutBtn.className = "absolute bottom-6 left-6 right-6 flex items-center justify-center gap-2 text-gray-400 hover:text-red-400 transition-colors text-sm font-medium py-3 rounded-full hover:bg-red-50";
    logoutBtn.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> ${t('logout')}`;
    logoutBtn.onclick = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };
    document.querySelector('aside').appendChild(logoutBtn);

    loadPatients();

    // Search input listener
    const searchInput = document.getElementById('patient-search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.trim();
                if (query.length > 0) {
                    searchPatients(query);
                } else {
                    loadPatients();
                }
            }, 500);
        });
    }

    // Recording Button Logic
    const recordBtn = document.getElementById('record-btn');
    recordBtn.addEventListener('click', toggleRecording);

    // Education Mode Listener
    // Education Mode Listener
    const educationToggle = document.getElementById('education-mode-toggle');
    if (educationToggle) {
        educationToggle.addEventListener('click', (e) => {
            const isTurningOn = e.target.checked;
            if (isTurningOn) {
                enableAssistantMode();
            } else {
                e.preventDefault();
                openPasswordModal();
            }
        });

        // Initialize Education Mode from Storage
        if (localStorage.getItem('educationMode') === 'true') {
            educationToggle.checked = true;
            enableAssistantMode(false); // false = don't show toast on init
        }
    }

    // Dark Mode Initialization
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        const dmToggle = document.getElementById('dark-mode-toggle');
        if (dmToggle) dmToggle.checked = true;
    }
});

function toggleDarkMode() {
    const html = document.documentElement;
    const toggle = document.getElementById('dark-mode-toggle');

    if (toggle.checked) {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
}

// Global state for assistant selection
let currentAssistantName = null;

function enableAssistantMode(showNotification = true) {
    const btn = document.getElementById('new-patient-btn');
    if (btn) btn.classList.add('hidden');
    document.body.classList.add('education-mode-active');
    localStorage.setItem('educationMode', 'true');

    // Show Sidebar Tabs
    const tabs = document.getElementById('sidebar-tabs');
    if (tabs) tabs.classList.remove('hidden');

    // Default to Patients tab
    switchSidebarTab('patients');

    if (showNotification) {
        showToast("⚠️ Kısıtlı Asistan Modu Aktif. Yeni hasta girişi kapatıldı.", "warning");
    }

    if (currentPatientId) loadNotes(currentPatientId);
}

function disableAssistantMode() {
    const toggle = document.getElementById('education-mode-toggle');
    toggle.checked = false; // Visually uncheck it now

    const btn = document.getElementById('new-patient-btn');
    if (btn) btn.classList.remove('hidden');

    const assistBtn = document.getElementById('new-assistant-btn');
    if (assistBtn) assistBtn.classList.add('hidden');

    document.body.classList.remove('education-mode-active');
    localStorage.setItem('educationMode', 'false');

    // Hide Sidebar Tabs
    const tabs = document.getElementById('sidebar-tabs');
    if (tabs) tabs.classList.add('hidden');

    // Revert to Patients view just in case
    document.getElementById('patient-list').classList.remove('hidden');
    document.getElementById('assistant-list').classList.add('hidden');
    document.getElementById('sidebar-patients-title').classList.remove('hidden'); // Ensure title is back
    document.getElementById('sidebar-patients-title').innerText = t('patients_title');

    showToast("✅ Yönetici girişi doğrulandı. Normal moda dönüldü.");

    if (currentPatientId) loadNotes(currentPatientId);
}

function switchSidebarTab(tab) {
    const patientsList = document.getElementById('patient-list');
    const assistantsList = document.getElementById('assistant-list');
    const patientsTitle = document.getElementById('sidebar-patients-title');
    const tabPatients = document.getElementById('tab-patients');
    const tabAssistants = document.getElementById('tab-assistants');

    const newPatientBtn = document.getElementById('new-patient-btn');
    const newAssistantBtn = document.getElementById('new-assistant-btn');

    if (tab === 'patients') {
        // Show Patients
        patientsList.classList.remove('hidden');
        assistantsList.classList.add('hidden');
        patientsTitle.innerText = t('patients_title');
        patientsTitle.classList.remove('hidden');

        // Buttons: In Assistant Mode, New Patient is hidden. New Assistant is also hidden here.
        if (newPatientBtn) newPatientBtn.classList.add('hidden');
        if (newAssistantBtn) newAssistantBtn.classList.add('hidden');

        // Styles
        tabPatients.classList.add('text-primary', 'border-b-2', 'border-primary', 'font-bold');
        tabPatients.classList.remove('text-gray-400', 'font-medium');

        tabAssistants.classList.remove('text-primary', 'border-b-2', 'border-primary', 'font-bold');
        tabAssistants.classList.add('text-gray-400', 'font-medium');

    } else {
        // Show Assistants
        patientsList.classList.add('hidden');
        assistantsList.classList.remove('hidden');
        patientsTitle.innerText = "ASİSTANLAR";
        // patientsTitle.classList.add('hidden'); // Optional: hide "HASTALAR" title or change it

        // Buttons
        if (newPatientBtn) newPatientBtn.classList.add('hidden');
        if (newAssistantBtn) newAssistantBtn.classList.remove('hidden');

        // Styles
        tabAssistants.classList.add('text-primary', 'border-b-2', 'border-primary', 'font-bold');
        tabAssistants.classList.remove('text-gray-400', 'font-medium');

        tabPatients.classList.remove('text-primary', 'border-b-2', 'border-primary', 'font-bold');
        tabPatients.classList.add('text-gray-400', 'font-medium');

        loadAssistants();
    }
}

// Global cache for assistants
let globalAssistants = [];

async function loadAssistants() {
    const list = document.getElementById('assistant-list');
    list.innerHTML = `<div class="text-center text-gray-400 py-4"><i class="fa-solid fa-spinner fa-spin"></i></div>`;

    try {
        const res = await authenticatedFetch('/assistants/');
        globalAssistants = await res.json();
        renderAssistantList(globalAssistants);
    } catch (e) {
        console.error("Load Assistants Error:", e);
        list.innerHTML = `<div class="text-xs text-red-400 text-center py-4">Liste yüklenemedi.</div>`;
    }
}

function renderAssistantList(assistants) {
    const list = document.getElementById('assistant-list');
    list.innerHTML = '';

    if (assistants.length === 0) {
        list.innerHTML = '<div class="text-xs text-gray-400 text-center py-4">Kayıtlı asistan bulunamadı.</div>';
        return;
    }

    assistants.forEach(assistant => {
        const name = assistant.name;
        const div = document.createElement('div');
        div.className = `p-4 mb-2 rounded-[20px] cursor-pointer flex items-center justify-between group transition-all border border-transparent ${currentAssistantName === name ? 'bg-[#F0F7F4] dark:bg-slate-800 border-[#D4E0D9] dark:border-slate-700 shadow-sm' : 'hover:bg-[#FAFAF8] dark:hover:bg-slate-800/50 hover:border-[#E2EBE5] dark:hover:border-slate-700'}`;
        div.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden flex-1">
                <div class="w-10 h-10 rounded-full bg-yellow-100 dark:bg-slate-700 text-yellow-600 dark:text-yellow-500 flex items-center justify-center text-xs font-bold shrink-0 transition-colors">
                    ${name.substring(0, 2).toUpperCase()}
                </div>
                <div class="overflow-hidden">
                    <span class="font-medium ${currentAssistantName === name ? 'text-[#2D3630] dark:text-white' : 'text-gray-500 dark:text-gray-400'} truncate block">${name}</span>
                    <span class="text-[10px] text-gray-400 font-mono tracking-wider block">ID: #${assistant.id}</span>
                </div>
            </div>
             <div class="flex items-center gap-2">
                 <button onclick="deleteAssistant(event, ${assistant.id}, '${name}')" class="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i class="fa-solid fa-trash-can text-[10px]"></i>
                 </button>
                 <i class="fa-solid fa-chevron-right text-primary text-xs opacity-0 ${currentAssistantName === name ? 'opacity-100' : 'group-hover:opacity-100'} transition-opacity"></i>
            </div>
        `;
        div.onclick = () => selectAssistant(assistant);
        list.appendChild(div);
    });
}

function selectAssistant(assistant) {
    const name = assistant.name;
    currentAssistantName = name;

    // Update Header
    document.getElementById('patient-name-display').innerText = name;
    document.getElementById('patient-id-display').innerText = "Asistan Görüntüleme Modu";
    document.getElementById('patient-id-display').style.cursor = 'default';
    document.getElementById('patient-id-display').onclick = null;

    document.getElementById('current-patient-header').classList.remove('hidden');
    document.getElementById('no-patient-header').classList.add('hidden');
    document.getElementById('summarize-history-btn').classList.add('hidden');

    // Show Dashboard
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('patient-dashboard').classList.remove('hidden');
    document.getElementById('history-summary-card').classList.add('hidden');

    document.getElementById('recording-area').parentElement.classList.add('hidden');

    loadAssistants(); // Re-render to highlight selection
    loadNotesByAssistant(name);
}

async function deleteAssistant(event, id, name) {
    event.stopPropagation();
    if (!confirm(`${name} isimli asistanı silmek istediğinize emin misiniz?`)) return;

    try {
        const res = await authenticatedFetch(`/assistants/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Silinemedi");
        showToast("Asistan silindi.");

        if (currentAssistantName === name) {
            currentAssistantName = null;
            document.getElementById('patient-dashboard').classList.add('hidden');
            document.getElementById('empty-state').classList.remove('hidden');
            document.getElementById('current-patient-header').classList.add('hidden');
            document.getElementById('no-patient-header').classList.remove('hidden');
        }
        loadAssistants();
    } catch (e) {
        showToast("Hata: " + e.message, "error");
    }
}

async function loadNotesByAssistant(name) {
    const list = document.getElementById('notes-list');
    list.innerHTML = `<div class="text-center text-gray-400 py-4"><i class="fa-solid fa-spinner fa-spin"></i> ${t('processing')}</div>`;

    try {
        const res = await authenticatedFetch(`/notes/assistant/${encodeURIComponent(name)}`);
        const notes = await res.json();
        list.innerHTML = '';

        // Hide top risk area for assistant view as it might be mixed patients
        document.getElementById('risk-alert-area').classList.add('hidden');

        if (notes.length === 0) {
            list.innerHTML = `<div class="text-center text-gray-400 py-12 italic">Bu asistana ait not bulunamadı.</div>`;
            return;
        }

        // ... We can reuse existing render logic but we need to adapt it because 
        // the existing 'loadNotes' rendering logic is inside 'loadNotes' function and it's quite long.
        // I should have refactored 'renderNotes(notes)' separately. 
        // I will duplicate the rendering logic for now or try to extract it if I can in this edit.
        // Since I cannot easily extract without touching other parts, I will use a simplified render here 
        // OR better yet, I should check if I can quick-refactor in the same file.
        // Actually, let's just copy the card rendering logic for safety and consistency.

        notes.forEach(note => {
            // ... (Copy of card rendering logic, slightly adapted to show Patient Name) ...
            const dateStr = formatDate(note.created_at);
            // We don't have patient name in the note object from the standard schema usually unless we eager load or it's in the response.
            // The endpoint returns `List[schemas.Note]`. Schema Note has `patient_id`. It doesn't have `patient_name` by default unless we specifically added it.
            // Let's check schemas.py... Wait, I can't check it right now inside this tool call.
            // Assuming I might need to fetch patient details or the schema includes it. 
            // In `models.py`, `patient` is a relationship. Pydantic schema might not include it by default to avoid circular dep.
            // If I don't have patient name, I will just show "Hasta ID: #..."

            const card = document.createElement('div');
            card.className = "bg-white dark:bg-slate-900 rounded-[24px] p-6 note-card relative group border border-transparent dark:border-slate-800";

            // Add Patient Info Badge
            const patientBadge = `<span class="bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded-full font-bold mb-2 inline-block">Hasta ID: #${note.patient_id}</span>`;

            card.innerHTML = `
                 ${patientBadge}
                 <div class="flex items-center justify-between mb-4">
                     <div class="flex items-center gap-2">
                         <div class="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                         <div class="text-xs text-gray-400 dark:text-gray-500 font-medium font-mono">
                             ${dateStr}
                         </div>
                     </div>
                 </div>
 
                 <div class="space-y-4">
                     <div class="bg-[#FAFAF8] dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 group relative">
                        <div class="mb-2">
                             <p class="text-[10px] text-gray-400 font-bold tracking-widest uppercase flex items-center gap-1">
                                <i class="fa-solid fa-microphone-lines"></i> ${t('transcription_label')}
                            </p>
                        </div>
                         <div class="text-sm text-[#2D3630] dark:text-white leading-relaxed opacity-80 dark:opacity-100">
                             ${note.transcription || (currentLanguage === 'tr' ? 'Ses anlaşılamadı.' : 'Audio unintelligible.')}
                         </div>
                     </div>
                     
                     ${note.summary ? `
                        <div class="bg-[#F0F7F4] dark:bg-slate-800 p-5 rounded-2xl border border-[#D4E0D9] dark:border-slate-700">
                             <p class="text-[10px] text-primary font-bold tracking-widest uppercase flex items-center gap-1 mb-2">
                                <i class="fa-solid fa-robot"></i> ${t('ai_analysis_label')}
                            </p>
                            <p class="text-sm text-[#2D3630] dark:text-white markdown-body leading-relaxed">${formatMarkdown(note.summary)}</p>
                        </div>
                     ` : ''}
                     
                     <!-- Student Feedback specific to this assistant -->
                     ${note.feedbacks && note.feedbacks.length > 0 ? `
                        <div class="pt-4 border-t border-gray-100 dark:border-slate-800">
                             <p class="text-[10px] text-gray-400 font-bold mb-3 tracking-widest uppercase flex items-center gap-1">
                                <i class="fa-solid fa-user-graduate"></i> ${t('assistant_feedback_title')}
                            </p>
                            <div class="space-y-3">
                                ${note.feedbacks.filter(fb => fb.assistant_name === name).map(fb => `
                                    <div class="bg-yellow-50/50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900 p-3 rounded-xl ml-2 text-sm">
                                        <div class="flex items-center justify-between mb-1">
                                            <span class="font-bold text-yellow-800 dark:text-yellow-400 text-xs">${fb.assistant_name}</span>
                                            <span class="text-[10px] text-gray-400">${formatDate(fb.created_at)}</span>
                                        </div>
                                        <p class="text-gray-700 dark:text-gray-200 leading-snug">${fb.content}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                     ` : ''}
                 </div>
             `;
            list.appendChild(card);
        });

    } catch (e) {
        console.error("Load Assistant Notes Error:", e);
        list.innerHTML = `<div class="text-xs text-red-400 text-center py-4">Notlar yüklenemedi.</div>`;
    }
}






async function authenticatedFetch(url, options = {}) {
    const headers = options.headers || {};
    headers['Authorization'] = `Bearer ${token}`;
    options.headers = headers;

    const res = await fetch(url, options);
    if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error("Unauthorized");
    }
    // 403 is now used for password verification failure, let the caller handle it to show a toast
    return res;
}

// --- Patient Management ---

async function loadPatients() {
    try {
        const res = await authenticatedFetch('/patients/');
        const patients = await res.json();
        renderPatientList(patients);
    } catch (e) {
        console.error(e);
    }
}

async function searchPatients(query) {
    try {
        const res = await authenticatedFetch(`/patients/search?query=${encodeURIComponent(query)}`);
        const patients = await res.json();
        renderPatientList(patients);
    } catch (e) {
        console.error(e);
    }
}

function renderPatientList(patients) {
    const list = document.getElementById('patient-list');
    list.innerHTML = '';

    if (patients.length === 0) {
        list.innerHTML = '<div class="text-xs text-gray-400 text-center py-4">Sonuç bulunamadı.</div>';
        return;
    }

    patients.forEach(p => {
        const div = document.createElement('div');
        div.className = `p-4 mb-2 rounded-[20px] cursor-pointer flex items-center justify-between group transition-all border border-transparent ${currentPatientId === p.id ? 'bg-[#F0F7F4] dark:bg-slate-800 border-[#D4E0D9] dark:border-slate-700 shadow-sm' : 'hover:bg-[#FAFAF8] dark:hover:bg-slate-800/50 hover:border-[#E2EBE5] dark:hover:border-slate-700'}`;
        div.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden flex-1">
                <div class="w-10 h-10 rounded-full ${currentPatientId === p.id ? 'bg-primary text-white' : 'bg-[#E2EBE5] dark:bg-slate-700 text-[#6E7A73] dark:text-gray-400'} flex items-center justify-center text-xs font-bold shrink-0 transition-colors">
                    ${p.name.substring(0, 2).toUpperCase()}
                </div>
                <div class="overflow-hidden">
                    <span class="font-medium ${currentPatientId === p.id ? 'text-[#2D3630] dark:text-white' : 'text-gray-500 dark:text-gray-400'} truncate block">${p.name}</span>
                    <span class="text-[10px] text-gray-400 font-mono tracking-wider block">#${p.unique_id || p.id}</span>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="deletePatient(event, ${p.id}, '${p.name.replace(/'/g, "\\'")}')" class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100" title="Hastayı Sil">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
                <i class="fa-solid fa-chevron-right text-primary text-xs opacity-0 ${currentPatientId === p.id ? 'opacity-100' : 'group-hover:opacity-100'} transition-opacity"></i>
            </div>
        `;
        div.onclick = () => selectPatient(p);
        list.appendChild(div);
    });
}

// ... createPatient and deletePatient remain same ... but skipping to uploadAudio modification ...

// ... (skipping createPatient/deletePatient for brevity in replaced block, assuming I need to keep them or I made a mistake by selecting too large block.
// Wait, I should not delete them. I will use a smaller replace block for uploadAudio and another for loadPatients refactor.)

// Let's split. First block: refactor loadPatients and add search.

// Old createPatient function removed/merged into forceCreatePatient
// Keeping place for structure if needed


async function deletePatient(event, id, name) {
    event.stopPropagation();
    if (!confirm(`${name} isimli hastayı silmek istediğinize emin misiniz ? Bu işlem geri alınamaz ve tüm notları silinir.`)) return;

    try {
        const res = await authenticatedFetch(`/patients/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast("Hasta silindi.");
            if (currentPatientId === id) {
                currentPatientId = null;
                // Reset View
                document.getElementById('patient-dashboard').classList.add('hidden');
                document.getElementById('empty-state').classList.remove('hidden');
                document.getElementById('current-patient-header').classList.add('hidden');
                document.getElementById('no-patient-header').classList.remove('hidden');
                document.getElementById('summarize-history-btn').classList.add('hidden');
            }
            loadPatients();
        } else {
            showToast("Silme işlemi başarısız.", "error");
        }
    } catch (e) {
        showToast("Hata oluştu.", "error");
    }
}

function selectPatient(patient) {
    currentPatientId = patient.id;

    // Update Header
    document.getElementById('patient-name-display').innerText = patient.name;
    document.getElementById('patient-id-display').innerText = `ID: #${patient.unique_id || patient.id} `;
    // Make ID copyable
    const idDisplay = document.getElementById('patient-id-display');
    idDisplay.style.cursor = 'pointer';
    idDisplay.title = 'Kodu kopyalamak için tıklayın';
    idDisplay.onclick = () => {
        navigator.clipboard.writeText(patient.unique_id || patient.id);
        showToast("Hasta kodu kopyalandı!");
    };

    document.getElementById('current-patient-header').classList.remove('hidden');
    document.getElementById('no-patient-header').classList.add('hidden');
    document.getElementById('summarize-history-btn').classList.remove('hidden');

    // Show Dashboard
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('patient-dashboard').classList.remove('hidden');
    document.getElementById('history-summary-card').classList.add('hidden'); // hide until requested

    // Highlight in list (simple reload for now to apply class)
    loadPatients();

    // Load Notes
    loadNotes(patient.id);
}

// --- Note Management ---

async function loadNotes(patientId) {
    const list = document.getElementById('notes-list');
    list.innerHTML = `<div class="text-center text-gray-400 py-4"><i class="fa-solid fa-spinner fa-spin"></i> ${t('processing')}</div>`;

    // Ensure assistants are loaded for feedback form
    if (globalAssistants.length === 0) {
        try {
            const res = await authenticatedFetch('/assistants/');
            globalAssistants = await res.json();
            console.log("Assistants loaded silently:", globalAssistants);
        } catch (e) {
            // Ignore error here, dropdown will just be empty
        }
    }

    try {
        const res = await authenticatedFetch(`/notes/patient/${patientId}?language=${currentLanguage}`);
        const notes = await res.json();
        list.innerHTML = '';

        if (notes.length === 0) {
            list.innerHTML = `<div class="text-center text-gray-400 py-12 italic">${currentLanguage === 'tr' ? 'Henüz kaydedilmiş bir görüşme yok.' : 'No consultations recorded yet.'}</div>`;
            return;
        }

        // Populate Top Assistant Area with the latest RELEVANT note's insights
        // Search for the first note that has any risks, suggestions or education notes
        let latestInsightNote = null;
        for (const note of notes) {
            if ((note.risks && note.risks.length > 0) ||
                (note.suggestions && note.suggestions.length > 0) ||
                (note.education_notes && note.education_notes.length > 0)) {
                latestInsightNote = note;
                break;
            }
        }

        const topContainer = document.getElementById('risk-alert-area');
        topContainer.innerHTML = '';
        let hasTopContent = false;

        if (latestInsightNote) {
            if (latestInsightNote.risks && latestInsightNote.risks.length > 0) {
                renderRiskItems(topContainer, latestInsightNote.risks);
                hasTopContent = true;
            }
            if (latestInsightNote.suggestions && latestInsightNote.suggestions.length > 0) {
                renderSuggestionItems(topContainer, latestInsightNote.suggestions);
                hasTopContent = true;
            }
            if (latestInsightNote.education_notes && latestInsightNote.education_notes.length > 0) {
                renderEducationItems(topContainer, latestInsightNote.education_notes);
                hasTopContent = true;
            }

            // Trigger Emergency Toast if critical risk exists in the latest relevant note
            const criticalRisk = latestInsightNote.risks ? latestInsightNote.risks.find(r => r.level === 'critical') : null;
            if (criticalRisk) {
                showEmergencyToast(criticalRisk.message);
            }
        }

        if (hasTopContent) {
            topContainer.classList.remove('hidden');
        } else {
            topContainer.classList.add('hidden');
        }

        // Sorting Logic
        const sortOrder = window.currentSortOrder || 'desc';
        console.log(`Sorting notes... Order: ${sortOrder}`); // DEBUG

        notes.sort((a, b) => {
            // Safeguard dates
            let dateA = new Date(a.created_at);
            let dateB = new Date(b.created_at);

            // If invalid, try to parse or fallback
            if (isNaN(dateA.getTime())) dateA = new Date(0);
            if (isNaN(dateB.getTime())) dateB = new Date(0);

            const timeA = dateA.getTime();
            const timeB = dateB.getTime();

            // Log first comparison to debug
            // console.log(`Compare: ${a.created_at} vs ${b.created_at} => ${timeA} vs ${timeB}`);

            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });

        console.log("Notes sorted. First note date:", notes[0]?.created_at); // DEBUG

        notes.forEach(note => {
            const dateStr = formatDate(note.created_at);
            const card = document.createElement('div');
            card.className = "bg-white dark:bg-slate-900 rounded-[24px] p-6 note-card relative group border border-transparent dark:border-slate-800";
            card.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                        <div class="text-xs text-gray-400 dark:text-gray-500 font-medium font-mono">
                            ${dateStr}
                        </div>
                    </div>
                </div>

                <div class="space-y-4">
                    <!-- Transcription -->
                    <div class="bg-[#FAFAF8] dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 group relative">
                        <div class="flex items-center justify-between mb-2">
                             <p class="text-[10px] text-gray-400 font-bold tracking-widest uppercase flex items-center gap-1">
                                <i class="fa-solid fa-microphone-lines"></i> ${t('transcription_label')}
                            </p>
                            
                            <!-- Action Buttons -->
                            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick="toggleEditNote(${note.id})" class="text-xs text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-slate-700 p-1.5 rounded-lg" title="Düzenle">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <button onclick="deleteNote(${note.id})" class="text-xs text-red-500 hover:text-red-600 bg-red-50 dark:bg-slate-700 p-1.5 rounded-lg" title="Sil">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                                <button onclick="downloadPdf(${note.id})" class="text-xs text-gray-500 hover:text-gray-600 bg-gray-100 dark:bg-slate-700 p-1.5 rounded-lg" title="PDF İndir">
                                    <i class="fa-solid fa-file-pdf"></i>
                                </button>
                            </div>
                        </div>

                        <div id="transcription-text-${note.id}" class="text-sm text-[#2D3630] dark:text-white leading-relaxed opacity-80 dark:opacity-100">
                            ${note.transcription || (currentLanguage === 'tr' ? 'Ses anlaşılamadı.' : 'Audio unintelligible.')}
                        </div>
                        <textarea id="transcription-edit-${note.id}" class="hidden w-full p-4 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-white focus:ring-2 focus:ring-primary outline-none resize-none leading-relaxed" rows="6">${note.transcription || ''}</textarea>
                        
                        <div id="edit-actions-${note.id}" class="hidden mt-2 flex justify-end gap-2">
                            <button onclick="cancelEditNote(${note.id})" class="text-xs text-gray-500 hover:text-gray-700 px-3 py-1">${t('cancel')}</button>
                            <button onclick="saveNoteEdit(${note.id})" class="text-xs bg-primary text-white px-3 py-1 rounded-lg hover:bg-sky-600">${t('save')}</button>
                        </div>
                    </div>

                    <!-- Summary Area -->
                    <div id="summary-container-${note.id}">
                        ${note.summary ? `
                            <div class="bg-[#F0F7F4] dark:bg-slate-800 p-5 rounded-2xl border border-[#D4E0D9] dark:border-slate-700">
                                <div class="flex items-center justify-between mb-2">
                                    <p class="text-[10px] text-primary font-bold tracking-widest uppercase flex items-center gap-1">
                                        <i class="fa-solid fa-robot"></i> ${t('ai_analysis_label')}
                                    </p>
                                    <button onclick="downloadPdf(${note.id})" class="text-xs bg-white dark:bg-slate-700 border border-primary/30 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-2 font-bold group-hover:shadow-md">
                                        <i class="fa-solid fa-file-pdf text-lg"></i> PDF İndir
                                    </button>
                                </div>
                                <p class="text-sm text-[#2D3630] dark:text-white markdown-body leading-relaxed">${formatMarkdown(note.summary)}</p>
                            </div>
                        ` : `
                            <button onclick="summarizeNote(${note.id})" class="group/btn flex items-center gap-3 text-sm text-[#7E57C2] font-medium transition-all p-2 rounded-xl hover:bg-[#F3F0FF] w-full">
                                <span class="w-8 h-8 rounded-full bg-[#F3F0FF] flex items-center justify-center group-hover/btn:bg-white transition-colors">
                                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                                </span>
                                ${t('analyze_btn')}
                            </button>
                        `}
                    </div>

                    <!-- Education Notes -->
                    ${note.education_notes && note.education_notes.length > 0 ? `
                        <div class="student-feedback-area mt-4">
                            <div class="risk-alert info bg-emerald-50 dark:bg-emerald-900/40 border-emerald-500 text-emerald-900 dark:text-white">
                                <i class="fa-solid fa-graduation-cap text-xl mt-1"></i>
                                <div>
                                    <h4 class="font-bold text-sm uppercase tracking-wide mb-1 opacity-80 dark:opacity-100">${t('student_notes_title')}</h4>
                                    <div class="font-medium text-sm leading-relaxed">
                                        <ul class="list-disc pl-4 space-y-1 mt-1">
                                            ${note.education_notes.map(s => `<li>${s}</li>`).join('')}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Student Feedback Area (ALWAYS VISIBLE NOW) -->
                    <div class="pt-4 border-t border-gray-100 dark:border-slate-800 student-feedback-area">
                         <p class="text-[10px] text-gray-400 font-bold mb-3 tracking-widest uppercase flex items-center gap-1">
                            <i class="fa-solid fa-user-graduate"></i> ${t('assistant_feedback_title')}
                        </p>
                        
                        <!-- Feedback History -->
                        <div id="feedback-history-${note.id}" class="space-y-3 mb-4 max-h-[200px] overflow-y-auto pr-1">
                            ${note.feedbacks && note.feedbacks.length > 0 ? note.feedbacks.map(fb => `
                                <div class="bg-yellow-50/50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900 p-3 rounded-xl rounded-tl-none ml-2 text-sm group/fb relative">
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="font-bold text-yellow-800 dark:text-yellow-400 text-xs">${fb.assistant_name || 'Asistan'}</span>
                                        <div class="flex items-center gap-2">
                                            <span class="text-[10px] text-gray-400">${formatDate(fb.created_at)}</span>
                                            ${fb.assistant_id ? `
                                            <div class="opacity-0 group-hover/fb:opacity-100 transition-opacity flex gap-1">
                                                <button onclick="openAssistantActionModal('edit', ${fb.id}, '${(fb.content || '').replace(/'/g, "\\'")}')" class="text-blue-500 hover:text-blue-700 p-1" title="Düzenle"><i class="fa-solid fa-pen"></i></button>
                                                <button onclick="openAssistantActionModal('delete', ${fb.id})" class="text-red-500 hover:text-red-700 p-1" title="Sil"><i class="fa-solid fa-trash"></i></button>
                                            </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                    <p class="text-gray-700 dark:text-gray-200 leading-snug">${fb.content}</p>
                                </div>
                            `).join('') : `<p class="text-xs text-gray-400 italic text-center py-2">${currentLanguage === 'tr' ? 'Henüz bir görüş eklenmemiş.' : 'No feedback added yet.'}</p>`}
                        </div>

                        <!-- Input Area -->
                        <div class="space-y-2">
                             <div class="grid grid-cols-2 gap-2">
                                <select id="assistant-select-${note.id}" 
                                    class="w-full text-xs p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-yellow-400 outline-none text-gray-700 dark:text-white appearance-none cursor-pointer">
                                    <option value="" disabled selected>${currentLanguage === 'tr' ? 'Asistan Seçiniz' : 'Select Assistant'}</option>
                                    ${globalAssistants.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                                </select>
                                
                                <input type="password" id="assistant-password-${note.id}" 
                                    class="w-full text-xs p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-yellow-400 outline-none placeholder-gray-400 text-gray-700 dark:text-white" 
                                    placeholder="${currentLanguage === 'tr' ? 'Şifre' : 'Password'}">
                            </div>

                            <textarea id="feedback-${note.id}" 
                                class="w-full text-sm p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none transition-all resize-none min-h-[60px] placeholder-gray-400 text-gray-700 dark:text-white"
                                placeholder="${currentLanguage === 'tr' ? 'Bu vaka hakkında not ekleyin...' : 'Add a note about this case...'}"
                            ></textarea>
                            
                            <div class="flex justify-end">
                                <button onclick="saveStudentFeedback(${note.id})" 
                                    class="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-4 py-2 rounded-lg shadow-sm transition-colors font-bold flex items-center gap-1">
                                    <i class="fa-solid fa-paper-plane"></i> ${t('send')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    } catch (e) {
        console.error("Load Notes Error:", e);
        list.innerHTML = `<div class="text-center text-red-400 py-4">${currentLanguage === 'tr' ? 'Notlar yüklenirken hata oluştu.' : 'Error loading notes.'}<br><span class="text-xs opacity-75">${e.message}</span></div>`;
    }
}

async function saveStudentFeedback(noteId) {
    const feedback = document.getElementById(`feedback-${noteId}`).value;
    const assistantSelect = document.getElementById(`assistant-select-${noteId}`);
    const assistantId = assistantSelect.value;
    const password = document.getElementById(`assistant-password-${noteId}`).value;

    if (!feedback || !assistantId || !password) {
        showToast("Lütfen asistan seçin, şifre girin ve mesaj yazın.", "error");
        return;
    }

    try {
        const res = await authenticatedFetch(`/notes/${noteId}/feedback`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                feedback: feedback,
                assistant_id: parseInt(assistantId),
                password: password
            })
        });

        if (res.ok) {
            showToast("Asistan görüşü kaydedildi.");
            document.getElementById(`feedback-${noteId}`).value = '';
            document.getElementById(`assistant-password-${noteId}`).value = '';
            // Ideally reload notes to show the new feedback, but to prevent scroll jump maybe just append?
            // Simple reload for correctness
            loadNotes(currentPatientId);
        } else {
            const err = await res.json();
            showToast(err.detail || "Kaydedilemedi.", "error");
        }
    } catch (e) {
        showToast("Hata oluştu: " + e.message, "error");
    }
}

function showEmergencyToast(message) {
    // Remove existing if any
    const existing = document.getElementById('emergency-toast-alert');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = 'emergency-toast-alert';
    div.className = 'emergency-toast';
    div.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation text-3xl"></i>
        <div>
            <h4 class="font-bold text-lg uppercase tracking-wide">${currentLanguage === 'tr' ? 'ACİL DURUM' : 'EMERGENCY'}</h4>
            <p class="font-medium text-sm leading-tight mt-1">${message}</p>
        </div>
        <button onclick="this.parentElement.remove()" class="ml-auto text-white/80 hover:text-white">
            <i class="fa-solid fa-xmark text-xl"></i>
        </button>
    `;
    document.body.appendChild(div);

    // Auto dismiss after 10 seconds? No, user requested it to stay until closed or specific action. 
    // Let's keep it persistent as per "Risk & Warning System" usually implies user acknowledgement.
}

async function summarizeHistory() {
    if (!currentPatientId) return;

    const btn = document.getElementById('summarize-history-btn');
    const originalText = document.getElementById('btn-history-summary-text')?.innerText || t('history_summary_btn');

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        console.log(`Summarizing history for ${currentPatientId} in ${currentLanguage}...`);
        const res = await authenticatedFetch(`/notes/patient/${currentPatientId}/summarize?language=${currentLanguage}`);
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "API Error");
        }

        const data = await res.json();
        console.log("Summary data received:", data);

        // Show in Dashboard
        const card = document.getElementById('history-summary-card');
        const content = document.getElementById('history-summary-content');

        if (!data.summary) {
            showToast(currentLanguage === 'tr' ? "Özet boş döndü." : "Summary is empty.", "error");
            content.innerHTML = '<span class="text-red-400">' + (currentLanguage === 'tr' ? 'Özet oluşturulamadı.' : 'Could not generate summary.') + '</span>';
        } else {
            card.classList.remove('hidden');
            content.innerHTML = formatMarkdown(data.summary);
            showToast(currentLanguage === 'tr' ? "Genel durum özeti oluşturuldu." : "General history summary created.");
        }

    } catch (e) {
        console.error("Summary error:", e);
        showToast(e.message, "error");
        // Also show in the card if possible
        const content = document.getElementById('history-summary-content');
        if (content) content.innerHTML = `<span class="text-red-400 text-sm">${e.message}</span>`;
    } finally {
        // Restore button state
        const restoredText = t('history_summary_btn'); // Use translation
        btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <span id="btn-history-summary-text">${restoredText}</span>`;
        btn.disabled = false;
    }
}

function formatMarkdown(text) {
    if (!text) return '';

    // Basic formatting
    let md = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/## (.*?)\n/g, '<h4 class="text-base font-bold text-primary mt-4 mb-2">$1</h4>')
        .replace(/### (.*?)\n/g, '<h5 class="text-sm font-bold text-gray-700 dark:text-gray-300 mt-3 mb-1">$1</h5>')
        .replace(/\n\*/g, '<br>•') // simple bullets
        .replace(/\n-/g, '<br>•');

    return md;
}

async function summarizeNote(noteId) {
    const container = document.getElementById(`summary-container-${noteId}`);
    container.innerHTML = `<div class="text-sm text-gray-400 animate-pulse"><i class="fa-solid fa-spinner fa-spin"></i> ${t('analyzing')}</div>`;

    try {
        const res = await authenticatedFetch(`/notes/${noteId}/summarize?language=${currentLanguage}`, {
            method: 'POST'
        });
        const note = await res.json();

        container.innerHTML = `
            <div class="bg-blue-50 dark:bg-slate-800 p-3 rounded-lg border border-blue-100 dark:border-slate-700 animate-fade-in">
                <p class="text-xs text-uppercase text-primary font-bold mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-robot"></i> ${t('ai_analysis_label')}
                </p>
                <p class="text-sm text-gray-800 dark:text-white markdown-body leading-relaxed">${formatMarkdown(note.summary)}</p>
            </div>
        `;
        showToast(t('toast_summary_ok'));
    } catch (e) {
        container.innerHTML = `
            <button onclick="summarizeNote(${noteId})" class="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-2 transition-colors">
                <i class="fa-solid fa-rotate-right"></i> ${currentLanguage === 'tr' ? 'Hata oluştu. Tekrar dene.' : 'Error. Try again.'}
            </button>
        `;
        showToast(currentLanguage === 'tr' ? "Özetleme başarısız." : "Summary failed.", "error");
    }
}

async function uploadAudio(audioBlob) {
    if (!currentPatientId) return;

    // Show processing
    const controls = document.getElementById('recording-controls');
    const processing = document.getElementById('processing-indicator');
    controls.classList.add('hidden');
    processing.classList.remove('hidden');
    processing.classList.add('flex');
    const procText = processing.querySelector('p');
    if (procText) procText.innerText = t('processing');

    const formData = new FormData();
    // Default to wav, but try to use mime type from blob if available
    let ext = 'wav';
    if (audioBlob.type.includes('webm')) ext = 'webm';
    else if (audioBlob.type.includes('mp4')) ext = 'mp4';
    else if (audioBlob.type.includes('ogg')) ext = 'ogg';

    formData.append("file", audioBlob, `recording.${ext}`);
    formData.append("patient_id", currentPatientId);

    // Capture Education Mode
    const educationMode = document.getElementById('education-mode-toggle').checked;
    formData.append("education_mode", educationMode);

    // Send Language
    formData.append("language", currentLanguage);

    try {
        const res = await authenticatedFetch('/notes/', {
            method: 'POST',
            body: formData
        });

        if (res.ok) {
            const data = await res.json(); // Get the note data including risks
            showToast("Not başarıyla kaydedildi.");
            loadNotes(currentPatientId);

            // Show Risks & Suggestions
            const container = document.getElementById('risk-alert-area');
            container.innerHTML = ''; // Clear previous

            let hasContent = false;

            if (data.risks && data.risks.length > 0) {
                console.log("🔥 Risks Received:", data.risks); // DEBUG LOG
                renderRiskItems(container, data.risks);
                hasContent = true;

                // Check for critical risks to show Emergency Toast
                const criticalRisk = data.risks.find(r => r.level === 'critical');
                console.log("🔥 Critical Risk Found:", criticalRisk); // DEBUG LOG
                if (criticalRisk) {
                    showEmergencyToast(criticalRisk.message);
                }
            } else {
                console.log("ℹ️ No risks returned in this analysis.");
            }

            if (data.suggestions && data.suggestions.length > 0) {
                renderSuggestionItems(container, data.suggestions);
                hasContent = true;
            }

            if (data.education_notes && data.education_notes.length > 0) {
                renderEducationItems(container, data.education_notes);
                hasContent = true;
            }

            if (hasContent) {
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden');
            }

        } else {
            const errData = await res.json(); // Try to get error details
            showToast(`Kayıt hatası: ${errData.detail || 'Bilinmeyen hata'}`, "error");
        }
    } catch (e) {
        showToast("Sunucu hatası: Bağlantı kurulamadı.", "error");
        console.error(e);
    } finally {
        // Restore UI
        controls.classList.remove('hidden');
        processing.classList.add('hidden');
        processing.classList.remove('flex');
    }
}

function renderRiskItems(container, risks) {
    risks.forEach(risk => {
        const div = document.createElement('div');
        div.className = `risk-alert ${risk.level}`; // critical, warning, info

        let icon = 'fa-circle-info';
        if (risk.level === 'critical') icon = 'fa-triangle-exclamation';
        if (risk.level === 'warning') icon = 'fa-bell';

        const typeLabel = risk.type === 'emergency' ? 'risk_critical' : 'risk_warning';

        div.innerHTML = `
            <i class="fa-solid ${icon} text-xl mt-1"></i>
            <div>
                <h4 class="font-bold text-sm uppercase tracking-wide mb-1 opacity-80 dark:opacity-100 dark:text-white">${t(typeLabel)}</h4>
                <p class="font-medium dark:text-white">${risk.message}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

function sortNotes(order) {
    window.currentSortOrder = order;

    // Update UI Buttons
    const btnDesc = document.getElementById('sort-desc-btn');
    const btnAsc = document.getElementById('sort-asc-btn');

    if (btnDesc && btnAsc) {
        if (order === 'desc') {
            btnDesc.classList.add('active', 'bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-primary');
            btnDesc.classList.remove('text-gray-400', 'hover:text-gray-600');

            btnAsc.classList.remove('active', 'bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-primary');
            btnAsc.classList.add('text-gray-400', 'hover:text-gray-600');
        } else {
            btnAsc.classList.add('active', 'bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-primary');
            btnAsc.classList.remove('text-gray-400', 'hover:text-gray-600');

            btnDesc.classList.remove('active', 'bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-primary');
            btnDesc.classList.add('text-gray-400', 'hover:text-gray-600');
        }
    }

    if (currentPatientId) {
        loadNotes(currentPatientId);
    } else {
        console.warn("Cannot sort: No patient selected.");
    }
}

// Note Actions
async function deleteNote(noteId) {
    if (!confirm(t('confirm_delete_note'))) return;
    try {
        const res = await authenticatedFetch(`/notes/${noteId}`, { method: 'DELETE' });
        if (res.ok) {
            showToast(t('toast_deleted'));
            loadNotes(currentPatientId);
        } else {
            showToast("Silinemedi.", "error");
        }
    } catch (e) {
        showToast("Hata oluştu.", "error");
    }
}

function toggleEditNote(noteId) {
    document.getElementById(`transcription-text-${noteId}`).classList.add('hidden');
    document.getElementById(`transcription-edit-${noteId}`).classList.remove('hidden');
    document.getElementById(`edit-actions-${noteId}`).classList.remove('hidden');
}

function cancelEditNote(noteId) {
    document.getElementById(`transcription-text-${noteId}`).classList.remove('hidden');
    document.getElementById(`transcription-edit-${noteId}`).classList.add('hidden');
    document.getElementById(`edit-actions-${noteId}`).classList.add('hidden');
}

async function saveNoteEdit(noteId) {
    const newText = document.getElementById(`transcription-edit-${noteId}`).value;
    try {
        const res = await authenticatedFetch(`/notes/${noteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcription: newText })
        });
        if (res.ok) {
            showToast(t('toast_updated'));
            loadNotes(currentPatientId);
        } else {
            showToast("Güncellenemedi.", "error");
        }
    } catch (e) {
        showToast("Hata oluştu.", "error");
    }
}



function downloadPdf(noteId) {
    // Direct PDF download
    window.open(`/notes/${noteId}/pdf`, '_blank');
}

function renderSuggestionItems(container, suggestions) {
    if (!suggestions || suggestions.length === 0) return;

    const div = document.createElement('div');
    // Using Tailwind classes for Violet theme
    div.className = `risk-alert info bg-violet-50 dark:bg-violet-900/40 border-violet-500 text-violet-900 dark:text-white`;

    // Build list
    let listHtml = '<ul class="list-disc pl-4 space-y-1 mt-1">';
    suggestions.forEach(s => listHtml += `<li>${s}</li>`);
    listHtml += '</ul>';

    div.innerHTML = `
        <i class="fa-solid fa-book-medical text-xl mt-1"></i>
        <div>
            <h4 class="font-bold text-sm uppercase tracking-wide mb-1 opacity-80 dark:opacity-100">${t('clinical_notes_title')}</h4>
            <div class="font-medium text-sm leading-relaxed">${listHtml}</div>
            <p class="text-[10px] mt-2 opacity-60 italic dark:opacity-100 dark:text-gray-300">${t('disclaimer')}</p>
        </div>
    `;
    container.appendChild(div);
}

function renderEducationItems(container, notes) {
    if (!notes || notes.length === 0) return;

    const div = document.createElement('div');
    // Using Tailwind classes for Emerald theme
    div.className = `risk-alert info bg-emerald-50 dark:bg-emerald-900/40 border-emerald-500 text-emerald-900 dark:text-white`;

    // Build list
    let listHtml = '<ul class="list-disc pl-4 space-y-1 mt-1">';
    notes.forEach(s => listHtml += `<li>${s}</li>`);
    listHtml += '</ul>';

    div.innerHTML = `
        <i class="fa-solid fa-graduation-cap text-xl mt-1"></i>
        <div>
            <h4 class="font-bold text-sm uppercase tracking-wide mb-1 opacity-80 dark:opacity-100">${t('student_notes_title')}</h4>
            <div class="font-medium text-sm leading-relaxed">${listHtml}</div>
        </div>
    `;
    container.appendChild(div);
}

// Assistant Modal Logic
function openNewAssistantModal() {
    document.getElementById('new-assistant-modal').classList.remove('hidden');
    const input = document.getElementById('new-assistant-name');
    if (input) input.focus();
}

function closeNewAssistantModal() {
    document.getElementById('new-assistant-modal').classList.add('hidden');
    document.getElementById('new-assistant-name').value = '';
    document.getElementById('new-assistant-password').value = '';
}

async function createAssistant() {
    const name = document.getElementById('new-assistant-name').value.trim();
    const password = document.getElementById('new-assistant-password').value.trim();

    if (!name || !password) {
        showToast("Lütfen isim ve şifre girin.", "error");
        return;
    }

    try {
        const res = await authenticatedFetch('/assistants/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, password })
        });

        if (res.ok) {
            showToast("Asistan başarıyla eklendi.");
            closeNewAssistantModal();
            loadAssistants();
            // Ensure we are on the list
            switchSidebarTab('assistants');
        } else {
            const err = await res.json();
            showToast(err.detail || "Eklenemedi.", "error");
        }
    } catch (e) {
        showToast("Hata oluştu: " + e.message, "error");
    }
}


// Deprecated old function, kept just in case but overridden above
function displayRisks(risks) {
    // moved logic into uploadAudio -> renderRiskItems
}

async function summarizeHistory() {
    if (!currentPatientId) {
        showToast(currentLanguage === 'tr' ? "Hasta seçili değil." : "No patient selected.", "error");
        return;
    }

    const btn = document.getElementById('summarize-history-btn');
    const originalText = btn.innerHTML;
    const processingText = currentLanguage === 'tr' ? 'İşleniyor...' : 'Processing...';
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${processingText}`;
    btn.disabled = true;

    try {
        console.log(`Summarizing history for ${currentPatientId} in ${currentLanguage}...`);
        // CORRECTED: Method is GET, and append language param
        const res = await authenticatedFetch(`/notes/patient/${currentPatientId}/summarize?language=${currentLanguage}`, {
            method: 'GET'
        });

        if (!res.ok) {
            throw new Error(`HTTP Error ${res.status}`);
        }

        const data = await res.json();
        console.log("Summary data:", data);

        const card = document.getElementById('history-summary-card');
        const content = document.getElementById('history-summary-content');

        if (!data.summary || data.summary.length === 0) {
            showToast(currentLanguage === 'tr' ? "Özet bilgisi boş döndü." : "Returned summary is empty.", "warning");
            return;
        }

        content.innerHTML = formatMarkdown(data.summary);
        card.classList.remove('hidden');
        showToast(currentLanguage === 'tr' ? "Geçmiş özeti oluşturuldu." : "History summary created.");

        // Scroll to summary
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (e) {
        console.error("Summary failed:", e);
        showToast(currentLanguage === 'tr' ? "Özet oluşturulamadı." : "Summary generation failed.", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// --- Audio Recording Logic ---

let isRecording = false;

async function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

async function startRecording() {
    if (!currentPatientId) {
        showToast("Lütfen önce bir hasta seçin!", "error");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });

            // Check if we actually recorded something
            if (audioBlob.size > 0) {
                uploadAudio(audioBlob);
            } else {
                showToast("Ses kaydedilemedi (Dosya boş).", "error");
            }

            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        isRecording = true;

        // UI Updates
        const btn = document.getElementById('record-btn');
        btn.classList.add('recording-pulse', 'bg-red-700');
        btn.innerHTML = '<i class="fa-solid fa-stop text-2xl"></i>'; // Change icon to Stop
        document.getElementById('record-status').innerText = "Kaydı Bitir";
        document.getElementById('recording-timer').classList.remove('hidden');

        // Simple Timer
        let seconds = 0;
        document.getElementById('recording-timer').innerText = "00:00";
        recordingTimerInterval = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            document.getElementById('recording-timer').innerText = `${mins}:${secs}`;
        }, 1000);

    } catch (err) {
        console.error("Mic Error:", err);
        showToast("Mikrofona erişilemedi: " + err.message, "error");
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        isRecording = false;

        // UI Updates
        const btn = document.getElementById('record-btn');
        btn.classList.remove('recording-pulse', 'bg-red-700');
        btn.innerHTML = '<i class="fa-solid fa-microphone text-2xl"></i>'; // Change icon back to Mic
        document.getElementById('record-status').innerText = "Kaydı Başlat";
        document.getElementById('recording-timer').classList.add('hidden');
        clearInterval(recordingTimerInterval);
    }
}

// --- Helpers ---


function openNewPatientModal() {
    // Reset State
    document.getElementById('new-patient-modal').classList.remove('hidden');
    document.getElementById('new-patient-name').value = '';

    showStep1();

    // Focus input
    setTimeout(() => document.getElementById('new-patient-name').focus(), 100);
}

// --- Assistant Feedback Actions ---

function openAssistantActionModal(type, feedbackId, currentContent = '') {
    const modal = document.getElementById('assistant-action-modal');
    const title = document.getElementById('action-modal-title');
    const icon = document.getElementById('action-modal-icon');
    const contentArea = document.getElementById('action-modal-content-area');
    const submitBtn = document.getElementById('action-modal-submit-btn');

    document.getElementById('action-modal-feedback-id').value = feedbackId;
    document.getElementById('action-modal-type').value = type;
    document.getElementById('action-modal-password').value = '';

    modal.classList.remove('hidden');

    if (type === 'edit') {
        title.innerText = "Yorumu Düzenle";
        icon.className = "fa-solid fa-pen";
        contentArea.classList.remove('hidden');
        document.getElementById('action-modal-feedback').value = currentContent;
        submitBtn.className = "px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-white rounded-full transition-colors font-medium shadow-lg shadow-yellow-200";
        submitBtn.innerText = "Güncelle";
    } else {
        title.innerText = "Yorumu Sil";
        icon.className = "fa-solid fa-trash-can";
        contentArea.classList.add('hidden');
        submitBtn.className = "px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors font-medium shadow-lg shadow-red-200";
        submitBtn.innerText = "Sil";
    }
}

function closeAssistantActionModal() {
    document.getElementById('assistant-action-modal').classList.add('hidden');
}

async function submitAssistantAction() {
    const id = document.getElementById('action-modal-feedback-id').value;
    const type = document.getElementById('action-modal-type').value;
    const password = document.getElementById('action-modal-password').value;
    const content = document.getElementById('action-modal-feedback').value;

    if (!password) {
        showToast("Lütfen şifrenizi girin.", "error");
        return;
    }

    const endpoint = `/assistants/feedback/${id}`;
    const method = type === 'edit' ? 'PATCH' : 'DELETE';
    const body = { password: password };

    if (type === 'edit') {
        if (!content) {
            showToast("Yorum içeriği boş olamaz.", "error");
            return;
        }
        body.content = content;
    }

    try {
        const res = await authenticatedFetch(endpoint, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            showToast(type === 'edit' ? "Yorum güncellendi." : "Yorum silindi.");
            closeAssistantActionModal();
            loadNotes(currentPatientId);
        } else {
            const err = await res.json();
            showToast(err.detail || "İşlem başarısız.", "error");
        }
    } catch (e) {
        showToast("Hata oluştu: " + e.message, "error");
    }
}

function showStep1() {

    document.getElementById('np-step-1').classList.remove('hidden');
    document.getElementById('np-step-loading').classList.add('hidden');
    document.getElementById('np-step-duplicates').classList.add('hidden');
    document.getElementById('np-step-code').classList.add('hidden');

    document.getElementById('patient-code-input').value = '';
}

function handleEnterKey(event) {
    if (event.key === 'Enter') {
        checkPatientName();
    }
}

async function checkPatientName() {
    const nameInput = document.getElementById('new-patient-name');
    const name = nameInput.value.trim();

    // Debug
    // showToast("Kontrol ediliyor...", "info");

    if (!name) {
        showToast("Lütfen bir isim girin.", "error");
        return;
    }

    // Show Loading
    document.getElementById('np-step-1').classList.add('hidden');
    document.getElementById('np-step-loading').classList.remove('hidden');

    try {
        const res = await authenticatedFetch(`/patients/check?name=${encodeURIComponent(name)}`);
        const duplicates = await res.json();

        if (duplicates.length > 0) {
            // Show Duplicates
            showDuplicates(duplicates);
        } else {
            // No duplicates -> Create immediately
            forceCreatePatient();
        }

    } catch (e) {
        console.error(e);
        showToast("Sunucu hatası kontrol edilemedi.", "error");
        showStep1(); // Go back
    }
}

function showDuplicates(duplicates) {
    const list = document.getElementById('duplicate-list');
    list.innerHTML = '';

    duplicates.forEach(p => {
        // Calculate relative time string
        const lastDate = new Date(p.last_visit_date);
        const now = new Date();
        const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

        let timeStr = "Bugün";
        if (diffDays === 1) timeStr = "Dün";
        else if (diffDays > 1 && diffDays < 30) timeStr = `${diffDays} gün önce`;
        else if (diffDays >= 30 && diffDays < 365) timeStr = `${Math.floor(diffDays / 30)} ay önce`;
        else if (diffDays >= 365) timeStr = `${Math.floor(diffDays / 365)} yıl önce`;

        const div = document.createElement('div');
        div.className = "bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between hover:bg-sky-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors";
        div.innerHTML = `
            <div>
                <span class="font-bold text-[#2D3630] dark:text-white text-sm block">${p.name}</span>
                <span class="text-[10px] text-gray-400 font-mono">#${p.unique_id || p.id}</span>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                <i class="fa-regular fa-clock mr-1"></i> ${timeStr}
            </div>
        `;
        div.onclick = () => selectExistingPatient(p.id); // We need to fetch full patient obj or just reuse logic
        list.appendChild(div);
    });

    document.getElementById('np-step-loading').classList.add('hidden');
    document.getElementById('np-step-duplicates').classList.remove('hidden');
}

async function selectExistingPatient(id) {
    // We only have limited info in duplicates, let's fetch full or just load by ID
    // We can reuse selectPatient logic if we have the full object, or just fetch it.
    // Easier: Close modal, then call select logic.
    try {
        // Fetch full patient data to ensure we have everything
        const res = await authenticatedFetch(`/patients/${id}`);
        if (!res.ok) throw new Error("Patient fetch failed");

        const patient = await res.json();

        closeNewPatientModal();

        // Ensure ID is passed as integer if needed, though JS is loose. 
        // But selectPatient expects an object with .id
        selectPatient(patient);
        showToast("Hasta dosyası açıldı.");
    } catch (e) {
        console.error("Select Existing Error:", e);
        showToast("Hasta bilgileri yüklenemedi: " + e.message, "error");
    }
}

function showCodeInput() {
    document.getElementById('np-step-duplicates').classList.add('hidden');
    document.getElementById('np-step-code').classList.remove('hidden');
    document.getElementById('patient-code-input').focus();
}

function backToDuplicates() {
    document.getElementById('np-step-code').classList.add('hidden');
    document.getElementById('np-step-duplicates').classList.remove('hidden');
}

async function selectByCode() {
    const code = document.getElementById('patient-code-input').value.trim();
    if (!code) return;

    // We can search patients by checking loaded list or server search.
    // Our search api searches names. We might need to iterate or add code search.
    // OR we just iterate loaded patients client side first?
    // Let's rely on search api or iterate since we have loadPatients().
    // Actually the user requirement implies finding a specific patient.

    // Quick fix: Iterate all patients (since we load all in loadPatients)
    // In a real large app we'd need an endpoint.

    // Let's refetch patients to be sure
    const res = await authenticatedFetch('/patients/');
    const patients = await res.json();

    const target = patients.find(p => (p.unique_id === code || String(p.id) === code)); // Fallback to DB ID if old data

    if (target) {
        closeNewPatientModal();
        selectPatient(target);
        showToast("Kod doğrulandı, dosya açılıyor.");
    } else {
        showToast("Bu kod ile hasta bulunamadı.", "error");
    }
}

async function forceCreatePatient() {
    const name = document.getElementById('new-patient-name').value.trim();

    try {
        const res = await authenticatedFetch('/patients/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (res.ok) {
            const newP = await res.json();
            closeNewPatientModal();
            loadPatients(); // Refresh list
            selectPatient(newP); // Auto-select new patient
            showToast("Yeni hasta oluşturuldu. Kod: " + (newP.unique_id || newP.id));
        }
    } catch (e) {
        showToast("Hata oluştu.", "error");
    }
}


function closeNewPatientModal() {
    document.getElementById('new-patient-modal').classList.add('hidden');
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.className = `fixed bottom-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg transform translate-y-0 opacity-100 transition-all duration-300 z-50 ${type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`;

    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// --- Security Modal Functions ---

function openPasswordModal() {
    document.getElementById('password-modal').classList.remove('hidden');
    document.getElementById('doctor-password-input').value = '';
    document.getElementById('doctor-password-input').focus();
    document.getElementById('password-error').classList.add('hidden');
}

function closePasswordModal() {
    document.getElementById('password-modal').classList.add('hidden');
    // Ensure toggle stays ON if they cancelled (visual revert if needed, though we prevented default)
    const toggle = document.getElementById('education-mode-toggle');
    if (toggle) toggle.checked = true;
}

async function verifyPasswordAndDisableAssistant() {
    const password = document.getElementById('doctor-password-input').value;
    const errorMsg = document.getElementById('password-error');

    try {
        const res = await authenticatedFetch('/auth/verify-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (res.ok) {
            closePasswordModal();
            disableAssistantMode();
        } else {
            errorMsg.innerText = "Hatalı şifre!";
            errorMsg.classList.remove('hidden');
        }
    } catch (e) {
        errorMsg.innerText = "Sunucu hatası!";
        errorMsg.classList.remove('hidden');
    }
}

function formatMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Headings - Support #, ##, ### (Allow end of string or newline)
        .replace(/### (.*?)(?:\n|$)/g, '<h5 class="text-sm font-bold uppercase text-gray-500 mt-2 mb-1 tracking-wide">$1</h5>')
        .replace(/## (.*?)(?:\n|$)/g, '<h4 class="text-md font-bold text-gray-700 mt-3 mb-2 border-b border-gray-100 pb-1">$1</h4>')
        .replace(/# (.*?)(?:\n|$)/g, '<h3 class="text-lg font-bold text-primary mt-4 mb-2">$1</h3>')
        // Lists (Handle * or - at start of line)
        .replace(/^\s*[\-\*]\s+(.*)$/gm, '<li class="ml-4 list-disc text-gray-600">$1</li>')
        // Line breaks (handle double newlines as paragraphs, single as breaks)
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
}
// Generate Random AI Case
async function generateAICase() {
    // UI Feedback
    const btn = document.getElementById('ai-case-btn');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ' + (currentLanguage === 'tr' ? 'Oluşturuluyor...' : 'Generating...');
    btn.disabled = true;

    try {
        const res = await authenticatedFetch(`/notes/generate-ai-case?language=${currentLanguage}`, {
            method: 'POST'
        });

        if (res.ok) {
            const newCaseNote = await res.json(); // It returns the created note

            // The backend creates a new patient and note.
            // We need to reload patients list to show the new "Demo Patient"
            await loadPatients();

            // Find the patient in the list (it will be the last created usually, or by ID)
            // Ideally backend returns patient info, but it returns the NOTE.
            // detailed note object usually contains patient_id.

            if (newCaseNote.patient_id) {
                // Use a slight timeout to ensure listing is ready or just fetch patient details
                // We can hackishly select by ID if we know it.
                // Let's find the patient object from the reloaded list.
                // Efficient way: loadPatients() renders list. We need to find the one with this ID.

                // Better: selectPatient by ID logic.
                // We need the patient object for selectPatient(p).
                // fetch it.
                const pRes = await authenticatedFetch(`/patients/${newCaseNote.patient_id}`);
                const patient = await pRes.json();
                selectPatient(patient);

                showToast(currentLanguage === 'tr' ? "Rastgele vaka oluşturuldu." : "Random case generated.");
            }
        } else {
            showToast(currentLanguage === 'tr' ? "Vaka oluşturulamadı." : "Could not generate case.", "error");
        }

    } catch (e) {
        console.error(e);
        showToast(currentLanguage === 'tr' ? "Hata oluştu." : "Error occurred.", "error");
    } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}

/* --- User Profile Management --- */

async function fetchProfile() {
    try {
        const res = await authenticatedFetch('/auth/me');
        if (res.ok) {
            const user = await res.json();

            // Format name for initials
            const names = (user.username || 'Doktor').trim().split(' ');
            let initials = '';
            if (names.length === 1) {
                initials = names[0].substring(0, 2).toUpperCase();
            } else {
                initials = names.map(n => n[0]).join('').substring(0, 2).toUpperCase();
            }

            // Elements
            const btnInitials = document.getElementById('profile-initials');
            const btnImg = document.getElementById('profile-img');
            const menuInitials = document.getElementById('menu-profile-initials');
            const menuImg = document.getElementById('menu-profile-img');

            // Set text content
            const pName = document.getElementById('profile-name');
            if (pName) pName.innerText = user.username;

            const pEmail = document.getElementById('profile-email');
            if (pEmail) pEmail.innerText = user.email;

            const pCount = document.getElementById('profile-patient-count');
            if (pCount) pCount.innerText = user.patient_count || 0;

            if (btnInitials) btnInitials.innerText = initials;
            if (menuInitials) menuInitials.innerText = initials;

            // Handle Profile Picture
            if (user.profile_picture) {
                const imgPath = user.profile_picture.startsWith('http') ? user.profile_picture : user.profile_picture;

                if (btnImg) {
                    btnImg.src = imgPath;
                    btnImg.classList.remove('hidden');
                    if (btnInitials) btnInitials.classList.add('hidden');
                }
                if (menuImg) {
                    menuImg.src = imgPath;
                    menuImg.classList.remove('hidden');
                    if (menuInitials) menuInitials.classList.add('hidden');
                }
            } else {
                if (btnImg) btnImg.classList.add('hidden');
                if (btnInitials) btnInitials.classList.remove('hidden');
                if (menuImg) menuImg.classList.add('hidden');
                if (menuInitials) menuInitials.classList.remove('hidden');
            }
        }
    } catch (e) {
        console.error("Failed to fetch profile:", e);
    }
}

function toggleProfileMenu() {
    const menu = document.getElementById('profile-menu');
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        // Small delay for transition
        setTimeout(() => {
            menu.classList.remove('opacity-0', 'scale-95');
        }, 10);
    } else {
        menu.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            menu.classList.add('hidden');
        }, 200);
    }
}

// Close menu when clicking outside
document.addEventListener('click', function (event) {
    const menu = document.getElementById('profile-menu');
    const btn = document.getElementById('profile-btn');

    if (menu && !menu.classList.contains('hidden') && !menu.contains(event.target) && !btn.contains(event.target)) {
        toggleProfileMenu();
    }
});

function togglePasswordChange() {
    const form = document.getElementById('password-change-form');
    if (form) form.classList.toggle('hidden');
}

async function submitPasswordChange() {
    const currentPass = document.getElementById('current-pass').value;
    const newPass = document.getElementById('new-pass').value;

    if (!currentPass || !newPass) {
        showToast(currentLanguage === 'tr' ? "Lütfen tüm alanları doldurun." : "Please fill all fields.", "error");
        return;
    }

    try {
        const res = await authenticatedFetch('/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_password: currentPass, new_password: newPass })
        });

        if (res.ok) {
            showToast(currentLanguage === 'tr' ? "Şifreniz başarıyla değiştirildi." : "Password changed successfully.");
            togglePasswordChange();
            document.getElementById('current-pass').value = '';
            document.getElementById('new-pass').value = '';
        } else {
            const err = await res.json();
            showToast(err.detail || (currentLanguage === 'tr' ? "Şifre değiştirilemedi." : "Could not change password."), "error");
        }
    } catch (e) {
        showToast(currentLanguage === 'tr' ? "Hata oluştu." : "An error occurred.", "error");
    }
}

async function uploadProfileImage(input) {
    if (!input.files || !input.files[0]) return;

    const formData = new FormData();
    formData.append('file', input.files[0]);

    try {
        const res = await authenticatedFetch('/auth/upload-profile-picture', {
            method: 'POST',
            body: formData
        });

        if (res.ok) {
            showToast(currentLanguage === 'tr' ? "Profil fotoğrafı güncellendi." : "Profile picture updated.");
            fetchProfile(); // Refresh UI
        } else {
            showToast(currentLanguage === 'tr' ? "Fotoğraf yüklenemedi." : "Could not upload photo.", "error");
        }
    } catch (e) {
        showToast(currentLanguage === 'tr' ? "Hata oluştu." : "An error occurred.", "error");
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}

// Init profile on load
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('token')) fetchProfile();
});
