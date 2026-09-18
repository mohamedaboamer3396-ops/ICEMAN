const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const adminLoginSubmit = document.getElementById("adminLoginSubmit");
const adminMessage = document.getElementById("adminMessage");

const loginBox = document.getElementById("loginBox");
const dashboard = document.getElementById("dashboard");
const logoutButton = document.getElementById("logoutButton");

const toolName = document.getElementById("toolName");
const toolDescription = document.getElementById("toolDescription");
const toolCategory = document.getElementById("toolCategory");
const toolType = document.getElementById("toolType");
const toolUrl = document.getElementById("toolUrl");
const saveTool = document.getElementById("saveTool");

const toolsList = document.getElementById("toolsList");


/* =========================
   حالة الإدارة
========================= */

window.icemanIsAdmin = false;


/* =========================
   رسالة الإدارة
========================= */

function showMessage(message, color = "#dc2626") {

  if (!adminMessage) return;

  adminMessage.textContent = message;
  adminMessage.style.color = color;
}


/* =========================
   إظهار لوحة التحكم
========================= */

function showDashboard() {

  window.icemanIsAdmin = true;

  if (loginBox) {
    loginBox.style.display = "none";
  }

  if (dashboard) {
    dashboard.style.display = "block";
  }

  if (logoutButton) {
    logoutButton.style.display = "block";
  }

  loadAdminTools();
}


/* =========================
   إخفاء لوحة التحكم
========================= */

function hideDashboard() {

  window.icemanIsAdmin = false;

  if (loginBox) {
    loginBox.style.display = "block";
  }

  if (dashboard) {
    dashboard.style.display = "none";
  }

  if (logoutButton) {
    logoutButton.style.display = "none";
  }

}


/* =========================
   تسجيل الدخول
========================= */

if (adminLoginSubmit) {

  adminLoginSubmit.addEventListener(
    "click",
    async () => {

      const email = adminEmail.value.trim();
      const password = adminPassword.value;

      if (!email || !password) {

        showMessage(
          "اكتب البريد الإلكتروني وكلمة المرور."
        );

        return;
      }


      adminLoginSubmit.disabled = true;
      adminLoginSubmit.textContent = "جاري الدخول...";

      showMessage("", "#16a34a");


      const { error } =
        await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });


      if (error) {

        showMessage(
          "البريد الإلكتروني أو كلمة المرور غير صحيحة."
        );

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

        showMessage(
          "هذا الحساب ليس لديه صلاحيات الإدارة."
        );

        adminLoginSubmit.disabled = false;
        adminLoginSubmit.textContent = "دخول الإدارة";

        return;
      }


      /* =========================
         نجاح الدخول
      ========================= */

      showMessage(
        "تم تسجيل الدخول بنجاح 👑",
        "#16a34a"
      );

      adminLoginSubmit.disabled = false;
      adminLoginSubmit.textContent = "دخول الإدارة";

      showDashboard();

    }
  );

}


/* =========================
   تحميل الأدوات
========================= */

async function loadAdminTools() {

  if (!toolsList) return;


  toolsList.innerHTML = `
    <div class="empty">
      جاري تحميل المحتوى...
    </div>
  `;


  const {
    data,
    error
  } = await supabaseClient
    .from("tools")
    .select("*")
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(
      "خطأ في تحميل الأدوات:",
      error
    );

    toolsList.innerHTML = `
      <div class="empty">
        حصل خطأ أثناء تحميل المحتوى.
      </div>
    `;

    return;
  }


  renderAdminTools(data || []);

}


/* =========================
   عرض الأدوات
========================= */

function renderAdminTools(tools) {

  if (!toolsList) return;


  if (!tools || tools.length === 0) {

    toolsList.innerHTML = `
      <div class="empty">
        لا توجد أدوات حالياً.
      </div>
    `;

    return;
  }


  toolsList.innerHTML = tools.map((tool) => {

    return `
      <article class="tool-card">

        <h3>
          ${escapeHTML(tool.name || "")}
        </h3>

        <p>
          ${escapeHTML(tool.description || "")}
        </p>

        <div class="tags">

          <span class="tag">
            ${escapeHTML(tool.category || "")}
          </span>

          <span class="tag">
            ${escapeHTML(tool.type || "")}
          </span>

          <span class="tag">
            ${escapeHTML(tool.price || "مجاني")}
          </span>

        </div>

        <a
          href="${escapeAttribute(tool.url || "#")}"
          target="_blank"
          rel="noopener noreferrer"
          style="
            display:block;
            text-align:center;
            text-decoration:none;
            background:#ecfdf3;
            color:#15803d;
            padding:10px;
            border-radius:11px;
            font-weight:800;
            margin-bottom:8px;
          "
        >
          🌐 فتح المحتوى
        </a>

        <button
          class="delete-btn"
          onclick="deleteAdminTool(${tool.id})"
        >
          🗑️ حذف المحتوى
        </button>

      </article>
    `;

  }).join("");

}


/* =========================
   إضافة أداة
========================= */

if (saveTool) {

  saveTool.addEventListener(
    "click",
    async () => {

      if (window.icemanIsAdmin !== true) {

        alert(
          "ليس لديك صلاحية لإضافة المحتوى."
        );

        return;
      }


      const name =
        toolName.value.trim();

      const description =
        toolDescription.value.trim();

      const category =
        toolCategory.value;

      const type =
        toolType.value;

      const url =
        toolUrl.value.trim();


      if (
        !name ||
        !description ||
        !category ||
        !type ||
        !url
      ) {

        alert(
          "من فضلك املأ كل البيانات."
        );

        return;
      }


      try {

        new URL(url);

      } catch {

        alert(
          "الرابط غير صحيح."
        );

        return;
      }


      saveTool.disabled = true;
      saveTool.textContent = "جاري الحفظ...";


      const {
        data,
        error
      } = await supabaseClient
        .from("tools")
        .insert([
          {
            name: name,
            description: description,
            category: category,
            type: type,
            price: "مجاني",
            url: url
          }
        ])
        .select()
        .single();


      saveTool.disabled = false;
      saveTool.textContent = "حفظ وإضافة";


      if (error) {

        console.error(
          "خطأ في إضافة المحتوى:",
          error
        );

        alert(
          "حصل خطأ أثناء إضافة المحتوى."
        );

        return;
      }


      toolName.value = "";
      toolDescription.value = "";
      toolCategory.value = "";
      toolType.value = "";
      toolUrl.value = "";


      await loadAdminTools();


      alert(
        "تمت إضافة المحتوى بنجاح ✅"
      );

    }
  );

}


/* =========================
   حذف أداة
========================= */

async function deleteAdminTool(id) {

  if (window.icemanIsAdmin !== true) {

    alert(
      "ليس لديك صلاحية الحذف."
    );

    return;
  }


  const confirmed =
    confirm(
      "هل أنت متأكد من حذف هذا المحتوى؟"
    );


  if (!confirmed) {
    return;
  }


  const {
    error
  } = await supabaseClient
    .from("tools")
    .delete()
    .eq("id", id);


  if (error) {

    console.error(
      "خطأ في حذف المحتوى:",
      error
    );

    alert(
      "لم يتم حذف المحتوى."
    );

    return;
  }


  await loadAdminTools();


  alert(
    "تم حذف المحتوى بنجاح 🗑️"
  );

}


window.deleteAdminTool = deleteAdminTool;


/* =========================
   تسجيل الخروج
========================= */

if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async () => {

      const confirmed =
        confirm(
          "هل تريد تسجيل الخروج من لوحة الإدارة؟"
        );


      if (!confirmed) {
        return;
      }


      await supabaseClient.auth.signOut();


      hideDashboard();


      adminEmail.value = "";
      adminPassword.value = "";


      showMessage(
        "تم تسجيل الخروج من الإدارة 🚪",
        "#16a34a"
      );

    }
  );

}


/* =========================
   حماية الصفحة عند الفتح
========================= */

async function startAdmin() {

  /*
    نتحقق من الجلسة الحالية.
    لا نسمح بالدخول إلا للحساب المدير.
  */

  const {
    data: {
      session
    }
  } = await supabaseClient.auth.getSession();


  if (!session) {

    hideDashboard();

    return;
  }


  const {
    data: isAdmin,
    error
  } = await supabaseClient.rpc(
    "is_admin"
  );


  if (error || !isAdmin) {

    await supabaseClient.auth.signOut();

    hideDashboard();

    showMessage(
      "هذا الحساب ليس لديه صلاحيات الإدارة."
    );

    return;
  }


  showDashboard();

}


/* =========================
   حماية النصوص
========================= */

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

  return escapeHTML(value);

}


/* =========================
   تشغيل لوحة الإدارة
========================= */

startAdmin();