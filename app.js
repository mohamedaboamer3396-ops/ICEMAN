const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const results = document.getElementById("results");

const openAddTool = document.getElementById("openAddTool");
const closeAddTool = document.getElementById("closeAddTool");
const addToolModal = document.getElementById("addToolModal");

const saveTool = document.getElementById("saveTool");

const toolName = document.getElementById("toolName");
const toolDescription = document.getElementById("toolDescription");
const toolCategory = document.getElementById("toolCategory");
const toolType = document.getElementById("toolType");
const toolUrl = document.getElementById("toolUrl");

const favoritesButton = document.getElementById("favoritesButton");

let tools = [];
let favorites = JSON.parse(localStorage.getItem("iceman_favorites")) || [];
let showingFavorites = false;
let selectedCategory = "";


/* =========================
   صلاحيات الإدارة
========================= */

function updateAddButtonVisibility() {
  if (!openAddTool) return;

  openAddTool.style.display =
    window.icemanIsAdmin === true ? "block" : "none";
}

window.addEventListener("iceman-admin-state", () => {
  updateAddButtonVisibility();
  displayTools(applyFilters(tools));
});

updateAddButtonVisibility();


/* =========================
   فتح وإغلاق نافذة الإضافة
========================= */

if (openAddTool) {
  openAddTool.addEventListener("click", () => {
    if (window.icemanIsAdmin !== true) {
      alert("ليس لديك صلاحية لإضافة المحتوى.");
      return;
    }

    addToolModal.classList.add("active");
  });
}

if (closeAddTool) {
  closeAddTool.addEventListener("click", () => {
    addToolModal.classList.remove("active");
  });
}

if (addToolModal) {
  addToolModal.addEventListener("click", (event) => {
    if (event.target === addToolModal) {
      addToolModal.classList.remove("active");
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && addToolModal) {
    addToolModal.classList.remove("active");
  }
});


/* =========================
   تحميل الأدوات من Supabase
========================= */

async function loadTools() {
  if (typeof supabaseClient === "undefined") {
    console.error("supabaseClient غير موجود.");
    return;
  }

  const { data, error } = await supabaseClient
    .from("tools")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("خطأ في تحميل الأدوات:", error);

    results.innerHTML = `
      <div style="
        grid-column: 1 / -1;
        text-align: center;
        padding: 30px;
        background: white;
        border-radius: 20px;
        color: #dc2626;
      ">
        حصلت مشكلة في تحميل الأدوات من قاعدة البيانات.
      </div>
    `;

    return;
  }

  tools = data || [];

  displayTools(tools);
}


/* =========================
   عرض الأدوات
========================= */

function displayTools(list) {
  if (!results) return;

  if (!list || list.length === 0) {
    results.innerHTML = `
      <div style="
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        background: white;
        border-radius: 20px;
        color: #64748b;
      ">
        لا توجد نتائج حالياً 🔍
      </div>
    `;

    return;
  }

  results.innerHTML = list.map((tool) => {
    const isFavorite = favorites.includes(tool.id);

    let actionText = "🌐 فتح الموقع";

    if (tool.type === "فيديو") {
      actionText = "▶️ مشاهدة الفيديو";
    } else if (tool.type === "تطبيق") {
      actionText = "📱 فتح التطبيق";
    } else if (tool.type === "أداة") {
      actionText = "🛠️ فتح الأداة";
    }

    const deleteButton = window.icemanIsAdmin === true
      ? `
        <button
          class="delete-tool-btn"
          onclick="deleteTool(${tool.id})"
          style="
            width: 100%;
            margin-top: 10px;
            padding: 10px;
            border: none;
            border-radius: 12px;
            background: #fee2e2;
            color: #dc2626;
            font-weight: 800;
            cursor: pointer;
          "
        >
          🗑️ حذف المحتوى
        </button>
      `
      : "";

    return `
      <article class="tool-card">

        <button
          class="favorite-btn"
          onclick="toggleFavorite(${tool.id})"
          title="المفضلة"
        >
          ${isFavorite ? "❤️" : "🤍"}
        </button>

        <div class="tool-icon">
          ${getIcon(tool.category, tool.type)}
        </div>

        <h3>${escapeHTML(tool.name || "")}</h3>

        <p>
          ${escapeHTML(tool.description || "")}
        </p>

        <div class="tool-info">

          <span class="tool-tag">
            ${escapeHTML(tool.category || "")}
          </span>

          <span class="tool-tag">
            ${escapeHTML(tool.type || "")}
          </span>

          <span class="tool-tag">
            ${escapeHTML(tool.price || "مجاني")}
          </span>

        </div>

        <a
          class="tool-action"
          href="${escapeAttribute(tool.url || "#")}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${actionText}
        </a>

        ${deleteButton}

      </article>
    `;
  }).join("");
}


/* =========================
   حذف أداة - للمدير فقط
========================= */

async function deleteTool(id) {
  if (window.icemanIsAdmin !== true) {
    alert("ليس لديك صلاحية الحذف.");
    return;
  }

  const tool = tools.find((item) => item.id === id);

  if (!tool) {
    return;
  }

  const confirmed = confirm(
    `هل أنت متأكد من حذف "${tool.name}"؟`
  );

  if (!confirmed) {
    return;
  }

  const { error } = await supabaseClient
    .from("tools")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("خطأ في حذف المحتوى:", error);

    alert(
      "لم يتم حذف المحتوى. تأكد من صلاحيات الإدارة."
    );

    return;
  }

  tools = tools.filter((item) => item.id !== id);

  favorites = favorites.filter(
    (favoriteId) => favoriteId !== id
  );

  localStorage.setItem(
    "iceman_favorites",
    JSON.stringify(favorites)
  );

  displayTools(applyFilters(tools));

  alert("تم حذف المحتوى بنجاح 🗑️");
}

window.deleteTool = deleteTool;


/* =========================
   الأيقونات
========================= */

function getIcon(category, type) {
  if (type === "فيديو") {
    return "🎬";
  }

  if (type === "تطبيق") {
    return "📱";
  }

  const icons = {
    AI: "🤖",
    "برمجة": "💻",
    Cybersecurity: "🔐",
    "تعليم": "🎓",
    "تصميم": "🎨",
    "فيديو": "🎬",
    "أدوات": "🛠️",
    "تطبيقات": "📱"
  };

  return icons[category] || "🌐";
}


/* =========================
   التحقق من YouTube
========================= */

function isYouTubeUrl(url) {
  try {
    const parsed = new URL(url);

    return (
      parsed.hostname.includes("youtube.com") ||
      parsed.hostname.includes("youtu.be")
    );
  } catch {
    return false;
  }
}


/* =========================
   استخراج ID فيديو YouTube
========================= */

function getYouTubeId(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.substring(1);
    }

    const videoId = parsed.searchParams.get("v");

    if (videoId) {
      return videoId;
    }

    const parts = parsed.pathname.split("/");

    const shortsIndex = parts.indexOf("shorts");

    if (
      shortsIndex !== -1 &&
      parts[shortsIndex + 1]
    ) {
      return parts[shortsIndex + 1];
    }

    const embedIndex = parts.indexOf("embed");

    if (
      embedIndex !== -1 &&
      parts[embedIndex + 1]
    ) {
      return parts[embedIndex + 1];
    }

    return null;
  } catch {
    return null;
  }
}


/* =========================
   المفضلة
========================= */

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(
      (favoriteId) => favoriteId !== id
    );
  } else {
    favorites.push(id);
  }

  localStorage.setItem(
    "iceman_favorites",
    JSON.stringify(favorites)
  );

  if (showingFavorites) {
    showFavorites();
  } else {
    displayTools(applyFilters(tools));
  }
}

window.toggleFavorite = toggleFavorite;


/* =========================
   عرض المفضلة
========================= */

if (favoritesButton) {
  favoritesButton.addEventListener("click", () => {
    showingFavorites = !showingFavorites;

    if (showingFavorites) {
      showFavorites();
    } else {
      displayTools(applyFilters(tools));
    }
  });
}

function showFavorites() {
  const favoriteTools = tools.filter((tool) =>
    favorites.includes(tool.id)
  );

  displayTools(favoriteTools);
}


/* =========================
   البحث
========================= */

function searchTools() {
  const query = searchInput.value
    .trim()
    .toLowerCase();

  selectedCategory = "";

  const filtered = tools.filter((tool) => {
    const name = String(tool.name || "")
      .toLowerCase();

    const description = String(tool.description || "")
      .toLowerCase();

    const category = String(tool.category || "")
      .toLowerCase();

    const type = String(tool.type || "")
      .toLowerCase();

    return (
      name.includes(query) ||
      description.includes(query) ||
      category.includes(query) ||
      type.includes(query)
    );
  });

  showingFavorites = false;

  /* عرض نتائج البحث */
  displayTools(filtered);

  /*
    النزول تلقائياً إلى النتائج
    بعد تحديث النتائج
  */
  requestAnimationFrame(() => {
    if (results) {
      results.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
}

if (searchButton) {
  searchButton.addEventListener(
    "click",
    searchTools
  );
}

if (searchInput) {
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchTools();
    }
  });

  searchInput.addEventListener("input", () => {
    if (searchInput.value.trim() === "") {
      selectedCategory = "";
      showingFavorites = false;
      displayTools(tools);
    }
  });
}


/* =========================
   التصنيفات
========================= */

document
  .querySelectorAll(".category-card")
  .forEach((card) => {

    card.addEventListener("click", () => {

      selectedCategory = card.dataset.category;

      showingFavorites = false;

      const filtered = tools.filter(
        (tool) =>
          tool.category === selectedCategory
      );

      /* عرض النتائج */
      displayTools(filtered);

      /*
        النزول تلقائياً إلى النتائج
        بعد تحديث النتائج
      */
      requestAnimationFrame(() => {
        if (results) {
          results.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });

    });

  });


/* =========================
   إضافة أداة جديدة
========================= */

if (saveTool) {
  saveTool.addEventListener("click", async () => {

    /* حماية إضافية */
    if (window.icemanIsAdmin !== true) {
      alert("ليس لديك صلاحية لإضافة المحتوى.");
      return;
    }

    const name = toolName.value.trim();
    const description = toolDescription.value.trim();
    const category = toolCategory.value;
    const type = toolType.value;
    const url = toolUrl.value.trim();

    if (
      !name ||
      !description ||
      !category ||
      !type ||
      !url
    ) {
      alert("من فضلك املأ كل البيانات.");
      return;
    }

    try {
      new URL(url);
    } catch {
      alert("الرابط غير صحيح.");
      return;
    }

    if (
      type === "فيديو" &&
      !isYouTubeUrl(url)
    ) {
      const continueAdding = confirm(
        "الرابط ليس من YouTube. هل تريد إضافته رغم ذلك؟"
      );

      if (!continueAdding) {
        return;
      }
    }

    saveTool.disabled = true;
    saveTool.textContent = "جاري الحفظ...";

    const { data, error } =
      await supabaseClient
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
        "خطأ في إضافة الأداة:",
        error
      );

      alert(
        "حصل خطأ أثناء الإضافة. افتح Console لمعرفة التفاصيل."
      );

      return;
    }

    tools.unshift(data);

    toolName.value = "";
    toolDescription.value = "";
    toolCategory.value = "";
    toolType.value = "";
    toolUrl.value = "";

    addToolModal.classList.remove("active");

    selectedCategory = "";
    showingFavorites = false;

    displayTools(tools);

    alert("تمت إضافة المحتوى بنجاح ✅");
  });
}


/* =========================
   الفلاتر
========================= */

function applyFilters(list) {
  let filtered = [...list];

  if (selectedCategory) {
    filtered = filtered.filter(
      (tool) =>
        tool.category === selectedCategory
    );
  }

  return filtered;
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
   تشغيل الموقع
========================= */

loadTools();
displayTools(tools);