const adminLoginButton = document.getElementById("adminLoginButton");
const adminModal = document.getElementById("adminModal");
const closeAdminModal = document.getElementById("closeAdminModal");

const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const adminLoginSubmit = document.getElementById("adminLoginSubmit");
const adminMessage = document.getElementById("adminMessage");

const adminPanelButton = document.getElementById("adminPanelButton");
const adminLogoutButton = document.getElementById("adminLogoutButton");

window.icemanIsAdmin = false;


/* =========================
   تحديث واجهة الإدارة
========================= */

function updateAdminUI() {
  window.dispatchEvent(
    new Event("iceman-admin-state")
  );
}


/* =========================
   إخفاء الإدارة
========================= */

function hideAdminUI() {
  window.icemanIsAdmin = false;

  const addButton = document.getElementById("openAddTool");

  if (addButton) {
    addButton.style.display = "none";
  }

  if (adminLoginButton) {
    adminLoginButton.style.display = "block";
  }

  if (adminPanelButton) {
    adminPanelButton.style.display = "none";
  }

  if (adminLogoutButton) {
    adminLogoutButton.style.display = "none";
  }

  updateAdminUI();
}


/* =========================
   تسجيل الدخول
========================= */

adminLoginButton.addEventListener("click", () => {
  adminModal.classList.add("active");

  if (adminMessage) {
    adminMessage.textContent = "";
  }

  adminEmail.focus();
});


/* =========================
   إغلاق نافذة الإدارة
========================= */

closeAdminModal.addEventListener("click", () => {
  adminModal.classList.remove("active");
});


adminModal.addEventListener("click", (event) => {
  if (event.target === adminModal) {
    adminModal.classList.remove("active");
  }
});


/* =========================
   دخول المدير
========================= */

adminLoginSubmit.addEventListener("click", async () => {

  const email = adminEmail.value.trim();
  const password = adminPassword.value;

  if (!email || !password) {
    adminMessage.textContent =
      "اكتب البريد الإلكتروني وكلمة المرور.";

    adminMessage.style.color = "#dc2626";

    return;
  }

  adminLoginSubmit.disabled = true;
  adminLoginSubmit.textContent = "جاري الدخول...";

  adminMessage.textContent = "";

  const { error } =
    await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

  if (error) {

    adminMessage.textContent =
      "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

    adminMessage.style.color = "#dc2626";

    adminLoginSubmit.disabled = false;
    adminLoginSubmit.textContent = "دخول الإدارة";

    return;
  }


  /* =========================
     التأكد أن الحساب مدير
  ========================= */

  const {
    data: isAdmin,
    error: adminError
  } = await supabaseClient.rpc("is_admin");


  if (adminError || !isAdmin) {

    await supabaseClient.auth.signOut();

    hideAdminUI();

    adminMessage.textContent =
      "هذا الحساب ليس لديه صلاحيات الإدارة.";

    adminMessage.style.color = "#dc2626";

    adminLoginSubmit.disabled = false;
    adminLoginSubmit.textContent = "دخول الإدارة";

    return;
  }


  /* =========================
     نجاح الدخول
  ========================= */

  window.icemanIsAdmin = true;

  if (adminLoginButton) {
    adminLoginButton.style.display = "none";
  }

  if (adminPanelButton) {
    adminPanelButton.style.display = "block";
  }

  if (adminLogoutButton) {
    adminLogoutButton.style.display = "block";
  }

  const addButton =
    document.getElementById("openAddTool");

  if (addButton) {
    addButton.style.display = "block";
  }

  updateAdminUI();

  adminMessage.textContent =
    "تم تسجيل الدخول بنجاح 👑";

  adminMessage.style.color = "#16a34a";

  adminLoginSubmit.disabled = false;
  adminLoginSubmit.textContent = "دخول الإدارة";

  setTimeout(() => {
    adminModal.classList.remove("active");
  }, 700);
});


/* =========================
   لوحة الإدارة
========================= */

adminPanelButton.addEventListener("click", () => {

  if (window.icemanIsAdmin !== true) {
    return;
  }

  const addButton =
    document.getElementById("openAddTool");

  if (addButton) {

    addButton.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    setTimeout(() => {
      addButton.click();
    }, 500);
  }
});


/* =========================
   خروج الإدارة
========================= */

if (adminLogoutButton) {

  adminLogoutButton.addEventListener(
    "click",
    async () => {

      const confirmed =
        confirm("هل تريد تسجيل الخروج من الإدارة؟");

      if (!confirmed) {
        return;
      }

      await supabaseClient.auth.signOut();

      hideAdminUI();

      alert("تم تسجيل الخروج من الإدارة 🚪");
    }
  );

}


/* =========================
   مهم جدًا:
   عند فتح الموقع لا ندخل الإدارة تلقائيًا
========================= */

async function startICEMAN() {

  // حذف أي تسجيل دخول محفوظ
  await supabaseClient.auth.signOut();

  // فتح الموقع كمستخدم عادي
  hideAdminUI();
}


/* =========================
   تشغيل الموقع
========================= */

startICEMAN();