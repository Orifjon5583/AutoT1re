// ==========================================
// 1. MA'LUMOTLAR BAZASI VA INIT
// ==========================================
function initDatabase() {
    if (!localStorage.getItem('products')) {
        const defaultProducts = [
            { id: 1, brand: "Chevrolet", model: "Cobalt", year: 2023, size: "195/65 R15", tireBrand: "Michelin", type: "Yumshoq", price: 75, img: "https://images.unsplash.com/photo-1578844251758-2f71da645217?w=500", rating: 5, warranty: "80,000 km", desc: "Juda yumshoq va shovqinsiz." },
            { id: 2, brand: "Chevrolet", model: "Gentra", year: 2022, size: "195/55 R15", tireBrand: "Hankook", type: "Zavod", price: 60, img: "https://images.unsplash.com/photo-1578844251758-2f71da645217?w=500", rating: 4, warranty: "50,000 km", desc: "Zavod standarti bo'yicha." }
        ];
        localStorage.setItem('products', JSON.stringify(defaultProducts));
    }
    if (!localStorage.getItem('adminUser')) localStorage.setItem('adminUser', JSON.stringify({ email: "admin@autotire.uz", password: "admin" }));
    if (!localStorage.getItem('orders')) localStorage.setItem('orders', JSON.stringify([]));
    if (!localStorage.getItem('credits')) localStorage.setItem('credits', JSON.stringify([]));
    
    // YANGI: BILDIRISHNOMALAR BAZASI
    if (!localStorage.getItem('notifications')) localStorage.setItem('notifications', JSON.stringify([]));
}

function getProducts() { return JSON.parse(localStorage.getItem('products')) || []; }

// ==========================================
// 2. AUTH (LOGIN / REGISTER / LOGOUT)
// ==========================================
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

function registerUser(e) {
    e.preventDefault();
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const pass = document.getElementById("reg-pass").value;
    let users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.email === email)) return showToast("Bu email band!", "error");
    users.push({ name, email, pass, role: 'user' });
    localStorage.setItem('users', JSON.stringify(users));
    showToast("Ro'yxatdan o'tdingiz!"); setTimeout(() => window.location.href = "login.html", 1500);
}

function loginUser(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const pass = document.getElementById("login-pass").value;
    const admin = JSON.parse(localStorage.getItem('adminUser'));
    
    if (email === admin.email && pass === admin.password) {
        localStorage.setItem('currentUser', JSON.stringify({ name: "Admin", role: "admin", email: email }));
        window.location.href = "admin-products.html";
        return;
    }
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.pass === pass);
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = "index.html";
    } else { showToast("Xato!", "error"); }
}

function logout() {
    if(confirm("Chiqishni xohlaysizmi?")) {
        localStorage.removeItem('currentUser');
        window.location.href = "login.html";
    }
}

function checkAuthUI() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const authBtns = document.querySelectorAll(".auth-btn");
    const profiles = document.querySelectorAll(".user-profile");
    const names = document.querySelectorAll(".user-name-display");
    
    // Bildirishnoma qutisini ko'rsatish/yashirish
    const notifBox = document.getElementById("notification-box");
    if(notifBox) {
        if(user && user.role !== 'admin') notifBox.classList.remove("hidden");
        else notifBox.classList.add("hidden");
    }

    if (user) {
        authBtns.forEach(el => el.classList.add("hidden"));
        profiles.forEach(el => el.classList.remove("hidden"));
        names.forEach(el => el.innerText = user.name);
        checkNotifications(); // Bildirishnomalarni tekshirish
    } else {
        authBtns.forEach(el => el.classList.remove("hidden"));
        profiles.forEach(el => el.classList.add("hidden"));
    }
}

// ==========================================
// 3. BILDIRISHNOMALAR (NOTIFICATIONS) - YANGI
// ==========================================
function checkNotifications() {
    if (!currentUser) return;
    const allNotes = JSON.parse(localStorage.getItem('notifications')) || [];
    // Faqat shu userga tegishli va o'qilmagan xabarlar
    const myNotes = allNotes.filter(n => n.targetUser === currentUser.name && !n.read);
    
    const badge = document.getElementById("notif-badge");
    const list = document.getElementById("notif-list");
    
    if (badge) {
        if (myNotes.length > 0) {
            badge.innerText = myNotes.length;
            badge.classList.remove("hidden");
        } else {
            badge.classList.add("hidden");
        }
    }

    if (list) {
        list.innerHTML = "";
        if (myNotes.length === 0) {
            list.innerHTML = `<div class="p-4 text-center text-gray-400 text-sm">Yangi xabarlar yo'q</div>`;
        } else {
            myNotes.forEach(n => {
                const icon = n.type === 'success' ? '<i class="fa-solid fa-circle-check text-green-500"></i>' : '<i class="fa-solid fa-circle-xmark text-red-500"></i>';
                list.innerHTML += `
                    <div class="p-3 border-b hover:bg-gray-50 text-sm">
                        <div class="font-bold flex items-center gap-2">${icon} ${n.title}</div>
                        <p class="text-gray-600 mt-1">${n.message}</p>
                        <span class="text-xs text-gray-400 block mt-2">${n.date}</span>
                    </div>
                `;
            });
            // Hammasini o'qilgan deb belgilash tugmasi
            list.innerHTML += `<button onclick="markAllRead()" class="w-full text-center text-blue-600 text-xs p-2 hover:bg-blue-50 font-bold">Hammasini o'qilgan deb belgilash</button>`;
        }
    }
}

function toggleNotifDropdown() {
    const dropdown = document.getElementById("notif-dropdown");
    dropdown.classList.toggle("hidden");
}

function markAllRead() {
    let allNotes = JSON.parse(localStorage.getItem('notifications')) || [];
    allNotes.forEach(n => {
        if (n.targetUser === currentUser.name) n.read = true;
    });
    localStorage.setItem('notifications', JSON.stringify(allNotes));
    checkNotifications();
}

// ==========================================
// 4. ADMIN PANEL (KREDIT STATUSI) - YANGILANGAN
// ==========================================
function renderAdminCredits() {
    const credits = JSON.parse(localStorage.getItem('credits')) || [];
    const tbody = document.getElementById("admin-credits-body");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (credits.length === 0) {
        tbody.innerHTML = "<tr><td colspan='7' class='p-8 text-center text-gray-400'>Kredit arizalari yo'q</td></tr>";
        return;
    }

    credits.reverse().forEach(c => {
        let statusHTML = '';
        if (c.status === 'Tasdiqlandi') {
            statusHTML = `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Tasdiqlandi</span>`;
        } else if (c.status === 'Rad etildi') {
            statusHTML = `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Rad etildi</span>`;
        } else {
            statusHTML = `
                <div class="flex gap-2">
                    <button onclick="updateCreditStatus(${c.id}, 'Tasdiqlandi')" class="bg-green-500 text-white w-8 h-8 rounded hover:bg-green-600 transition"><i class="fa-solid fa-check"></i></button>
                    <button onclick="updateCreditStatus(${c.id}, 'Rad etildi')" class="bg-red-500 text-white w-8 h-8 rounded hover:bg-red-600 transition"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `;
        }

        tbody.innerHTML += `
            <tr class="border-b hover:bg-gray-50 transition">
                <td class="p-4 text-gray-500">${c.date}</td>
                <td class="p-4 font-bold text-gray-800">${c.name}<br><span class="text-xs text-gray-500 font-normal">${c.phone}</span></td>
                <td class="p-4 text-sm text-gray-600">${c.passport}<br><span class="text-xs text-gray-400">${c.pinfl}</span></td>
                <td class="p-4 font-bold text-blue-600">$${c.totalWithPercent}</td>
                <td class="p-4"><span class="bg-gray-100 px-2 py-1 rounded text-xs font-bold">${c.months} oy</span></td>
                <td class="p-4 font-bold text-red-500 text-sm">${c.endDate}</td>
                <td class="p-4">${statusHTML}</td>
            </tr>
        `;
    });
}

// STATUS O'ZGARTIRISH VA BILDIRISHNOMA YUBORISH
function updateCreditStatus(id, newStatus) {
    let credits = JSON.parse(localStorage.getItem('credits')) || [];
    const index = credits.findIndex(c => c.id === id);
    
    if (index !== -1) {
        let reason = "";
        
        // Agar rad etilsa, sababini so'rash
        if (newStatus === 'Rad etildi') {
            reason = prompt("Rad etish sababini yozing (Mijozga ko'rinadi):");
            if (!reason) return; // Agar yozmasa, bekor qilish
        }

        credits[index].status = newStatus;
        localStorage.setItem('credits', JSON.stringify(credits));
        
        // BILDIRISHNOMA YARATISH
        let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
        notifications.push({
            id: Date.now(),
            targetUser: credits[index].name, // Kreditdagi ismga yuboramiz
            type: newStatus === 'Tasdiqlandi' ? 'success' : 'error',
            title: newStatus === 'Tasdiqlandi' ? 'Kreditingiz Tasdiqlandi! 🎉' : 'Kredit Rad Etildi ❌',
            message: newStatus === 'Tasdiqlandi' 
                ? `Tabriklaymiz! Sizning $${credits[index].totalWithPercent} lik arizangiz qabul qilindi. Tez orada aloqaga chiqamiz.` 
                : `Afsuski, arizangiz rad etildi. Sababi: ${reason}`,
            date: new Date().toLocaleString(),
            read: false
        });
        localStorage.setItem('notifications', JSON.stringify(notifications));

        renderAdminCredits();
        showToast(`Status o'zgardi: ${newStatus}`);
    }
}

// ==========================================
// 5. QOLGAN FUNKSIYALAR (O'ZGARISHSIZ)
// ==========================================
function renderAdminProducts() {
    const products = getProducts();
    const container = document.getElementById("admin-products");
    if (!container) return;
    container.innerHTML = "";
    products.forEach((p, index) => {
        container.innerHTML += `<div class="flex justify-between items-center bg-gray-50 p-3 rounded mb-2 border border-gray-200"><div class="text-sm"><strong>${p.tireBrand}</strong> ${p.size} <br><span class="text-gray-500">${p.brand} ${p.model} - $${p.price}</span></div><button onclick="deleteProduct(${index})" class="text-red-500 p-2"><i class="fa-solid fa-trash"></i></button></div>`;
    });
}
function addProduct(e) { e.preventDefault(); const brand = document.getElementById("p-brand").value; const model = document.getElementById("p-model").value; const tireBrand = document.getElementById("p-tire").value; const size = document.getElementById("p-size").value; const price = document.getElementById("p-price").value; let products = getProducts(); const newId = products.length > 0 ? products[products.length - 1].id + 1 : 1; products.push({ id: newId, brand, model, year: 2024, size, tireBrand, price: parseInt(price), type: "Yangi", rating: 5, warranty: "Yangi", img: "https://images.unsplash.com/photo-1578844251758-2f71da645217?w=500", desc: "Admin qo'shdi." }); localStorage.setItem('products', JSON.stringify(products)); showToast("Qo'shildi!"); e.target.reset(); renderAdminProducts(); }
function deleteProduct(index) { if(confirm("O'chirasizmi?")) { let p = getProducts(); p.splice(index, 1); localStorage.setItem('products', JSON.stringify(p)); renderAdminProducts(); } }
function renderAdminOrders() { const orders = JSON.parse(localStorage.getItem('orders')) || []; const container = document.getElementById("admin-orders"); if (!container) return; container.innerHTML = ""; if (orders.length === 0) { container.innerHTML = "<p class='text-gray-400 text-center'>Buyurtmalar yo'q</p>"; return; } orders.reverse().forEach(o => { container.innerHTML += `<div class="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-200"><div class="flex justify-between mb-2 border-b pb-2"><span class="font-bold text-blue-600">#${o.id}</span><span class="text-xs text-gray-500">${o.date}</span></div><h4 class="font-bold">${o.customer.name}</h4><p class="text-sm text-gray-600">${o.customer.phone} | ${o.customer.address}</p><div class="bg-gray-50 p-2 rounded text-sm mt-2"><strong>Jami: $${o.total}</strong> | ${o.customer.payment}</div></div>`; }); }
function setupSearch() { const b = document.getElementById("brand"), m = document.getElementById("model"), y = document.getElementById("year"), p = getProducts(); [...new Set(p.map(x=>x.brand))].forEach(x=>b.add(new Option(x,x))); b.onchange=()=>{ m.innerHTML='<option value="">Model...</option>'; m.disabled=true; y.innerHTML='<option value="">Yil...</option>'; y.disabled=true; [...new Set(p.filter(x=>x.brand===b.value).map(x=>x.model))].forEach(x=>{m.disabled=false;m.add(new Option(x,x))}); }; m.onchange=()=>{ y.innerHTML='<option value="">Yil...</option>'; y.disabled=true; [...new Set(p.filter(x=>x.brand===b.value&&x.model===m.value).map(x=>x.year))].forEach(x=>{y.disabled=false;y.add(new Option(x,x))}); }; }
function findTires() { const b=document.getElementById("brand").value, m=document.getElementById("model").value, y=document.getElementById("year").value, g=document.getElementById("results-grid"), r=document.getElementById("search-results"); if(!b||!m) return showToast("Tanlang!", "error"); g.innerHTML=""; r.classList.remove("hidden"); let res = getProducts().filter(p=>p.brand===b && p.model===m); if(y) res = res.filter(p=>p.year==y); res.forEach(t=>g.innerHTML+=createCard(t)); setTimeout(()=>r.scrollIntoView({behavior:'smooth'}),100); }
function renderCatalog(f='all') { const g=document.getElementById("catalog-grid"); if(!g)return; g.innerHTML=""; let i=getProducts(); if(f!=='all')i=i.filter(x=>x.tireBrand===f); i.forEach(t=>g.innerHTML+=createCard(t)); }
function createCard(t) { return `<div onclick="openProductModal(${t.id})" class="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition cursor-pointer fade-up"><div class="h-44 bg-blue-50 flex items-center justify-center mb-4 rounded-xl"><img src="${t.img}" class="h-full object-contain mix-blend-multiply group-hover:scale-110 transition"></div><h3 class="font-bold text-lg">${t.size}</h3><p class="text-xs text-gray-500">${t.brand} ${t.model}</p><div class="flex justify-between items-center mt-2"><span class="font-bold text-xl text-blue-600">$${t.price}</span><button onclick="event.stopPropagation(); addToCart(${t.id})" class="w-9 h-9 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-blue-600"><i class="fa-solid fa-plus"></i></button></div></div>`; }
function openProductModal(id) { const p=getProducts().find(x=>x.id===id); if(!p)return; document.getElementById("product-modal-body").innerHTML=`<div class="grid md:grid-cols-2 gap-8"><img src="${p.img}" class="w-full object-contain mix-blend-multiply"><div><h2 class="text-3xl font-bold">${p.size}</h2><p class="text-gray-600 my-4">${p.desc}</p><div class="flex justify-between items-center"><span class="text-3xl font-bold text-blue-600">$${p.price}</span><button onclick="addToCart(${p.id});closeProductModal()" class="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">Savatga</button></div></div></div>`; document.getElementById("product-modal").classList.remove("hidden"); }
function closeProductModal() { document.getElementById("product-modal").classList.add("hidden"); }
let cart = JSON.parse(localStorage.getItem('cart')) || [];
function updateCartBadge() { const b=document.querySelectorAll(".cart-badge"), t=cart.reduce((s,i)=>s+i.quantity,0); b.forEach(e=>{e.innerText=t;e.classList.toggle("hidden",t===0)}); }
function addToCart(id) { if(!localStorage.getItem('currentUser')){showToast("Avval kiring!","error");window.location.href="login.html";return;} const p=getProducts().find(x=>x.id===id), e=cart.find(x=>x.id===id); if(e)e.quantity++; else cart.push({...p,quantity:1}); localStorage.setItem('cart',JSON.stringify(cart)); updateCartBadge(); showToast("Qo'shildi!"); }
function renderCartPage() { const c=document.getElementById("cart-items-container"), t=document.getElementById("final-total"); if(!c)return; c.innerHTML=""; let tot=0; if(cart.length===0){c.innerHTML="<div class='text-center py-10 text-gray-400'>Bo'sh</div>";t.innerText="$0";return;} cart.forEach((i,x)=>{tot+=i.price*i.quantity;c.innerHTML+=`<div class="flex justify-between items-center bg-white p-4 rounded shadow mb-2"><div class="flex items-center gap-4"><img src="${i.img}" class="w-12 h-12 object-contain"><div><b>${i.tireBrand}</b><br>${i.size}</div></div><div class="flex items-center gap-3"><button onclick="chQ(${x},-1)">-</button><b>${i.quantity}</b><button onclick="chQ(${x},1)">+</button></div><div class="font-bold text-blue-600">$${i.price*i.quantity}</div><button onclick="rmI(${x})" class="text-red-500"><i class="fa-solid fa-trash"></i></button></div>`;}); t.innerText="$"+tot; }
function chQ(i,d){cart[i].quantity+=d; if(cart[i].quantity<1)cart[i].quantity=1; localStorage.setItem('cart',JSON.stringify(cart)); renderCartPage(); updateCartBadge();}
function rmI(i){if(confirm("O'chirasizmi?")){cart.splice(i,1); localStorage.setItem('cart',JSON.stringify(cart)); renderCartPage(); updateCartBadge();}}
function checkout(){if(cart.length===0)return showToast("Bo'sh!","error"); const u=JSON.parse(localStorage.getItem('currentUser')); if(u)document.getElementById("order-name").value=u.name; document.getElementById("checkout-total").innerText="$"+cart.reduce((s,i)=>s+i.price*i.quantity,0); document.getElementById("checkout-modal").classList.remove("hidden");}
function closeCheckout(){document.getElementById("checkout-modal").classList.add("hidden");}
function submitOrder(e){e.preventDefault(); const n=document.getElementById("order-name").value, p=document.getElementById("order-phone").value, a=document.getElementById("order-address").value, pay=document.querySelector('input[name="payment"]:checked').value, t=cart.reduce((s,i)=>s+i.price*i.quantity,0); let o=JSON.parse(localStorage.getItem('orders'))||[]; o.push({id:Date.now(),date:new Date().toLocaleString(),customer:{name:n,phone:p,address:a,payment:pay},items:cart,total:t}); localStorage.setItem('orders',JSON.stringify(o)); closeCheckout(); cart=[]; localStorage.setItem('cart',JSON.stringify(cart)); renderCartPage(); updateCartBadge(); alert("Buyurtma qabul qilindi!");}
function initCreditPage() { const c=JSON.parse(localStorage.getItem('cart'))||[]; let t=0; if(c.length>0){t=c.reduce((s,i)=>s+i.price*i.quantity,0);document.getElementById("credit-product-name").innerText=`${c.length} ta mahsulot`;document.getElementById("credit-total").innerText="$"+t;}else{document.getElementById("credit-product-name").innerText="Bo'sh";} window.creditTotal=t; }
function calculateCredit() { const m=parseInt(document.getElementById("credit-months").value), t=window.creditTotal||0, p=0.03, twp=t+(t*p*m), mp=twp/m; document.getElementById("monthly-pay").innerText="$"+mp.toFixed(2); document.getElementById("total-pay").innerText="$"+twp.toFixed(2); return {totalWithPercent:twp.toFixed(2),monthly:mp.toFixed(2)}; }
function submitCredit(e) { e.preventDefault(); const n=document.getElementById("cr-name").value, pass=document.getElementById("cr-passport").value, pin=document.getElementById("cr-pinfl").value, ph=document.getElementById("cr-phone").value, m=parseInt(document.getElementById("credit-months").value), td=new Date(), ed=new Date(); ed.setMonth(td.getMonth()+m); const c=calculateCredit(), nc={id:Date.now(),date:td.toLocaleDateString(),endDate:ed.toLocaleDateString(),name:n,passport:pass,pinfl:pin,phone:ph,months:m,totalWithPercent:c.totalWithPercent,monthly:c.monthly,items:JSON.parse(localStorage.getItem('cart'))||[], status: 'Kutilmoqda'}; let cr=JSON.parse(localStorage.getItem('credits'))||[]; cr.push(nc); localStorage.setItem('credits',JSON.stringify(cr)); localStorage.setItem('cart',JSON.stringify([])); showToast("Ariza yuborildi!"); setTimeout(()=>window.location.href="index.html",2000); }
function showToast(m,t='success'){let b=document.getElementById('toast-container');if(!b){b=document.createElement('div');b.id='toast-container';b.style.cssText="position:fixed;bottom:20px;right:20px;z-index:9999";document.body.appendChild(b);}const d=document.createElement('div');d.className=`bg-white border-l-4 ${t==='error'?'border-red-500':'border-green-500'} p-4 rounded shadow-lg mt-2 flex items-center gap-2 animate-bounce`;d.innerHTML=m;b.appendChild(d);setTimeout(()=>d.remove(),3000);}
function openModal(){if(document.getElementById("login-modal"))document.getElementById("login-modal").classList.remove("hidden");}
function closeModal(){if(document.getElementById("login-modal"))document.getElementById("login-modal").classList.add("hidden");}

// GLOBAL INIT
document.addEventListener("DOMContentLoaded", () => {
    initDatabase(); checkAuthUI(); updateCartBadge();
    if (document.getElementById("admin-products")) renderAdminProducts();
    if (document.getElementById("admin-orders")) renderAdminOrders();
    if (document.getElementById("admin-credits-body")) renderAdminCredits();
    if (document.getElementById("brand")) setupSearch();
    if (document.getElementById("catalog-grid")) renderCatalog();
    if (document.getElementById("cart-items-container")) renderCartPage();
    if (document.getElementById("credit-form")) { initCreditPage(); calculateCredit(); }
});