document.addEventListener('DOMContentLoaded', function () {
  let favoritesPresiden = JSON.parse(localStorage.getItem('favoritesPresiden')) || [];
  let favoritesDpr = JSON.parse(localStorage.getItem('favoritesDpr')) || [];
  let favoritesDpd = JSON.parse(localStorage.getItem('favoritesDpd')) || [];
  let favoritesDprdProvinsi = JSON.parse(localStorage.getItem('favoritesDprdProvinsi')) || [];
  let favoritesDprdKabupaten = JSON.parse(localStorage.getItem('favoritesDprdKabupaten')) || [];

  let selectedProvince = localStorage.getItem('selectedProvince');
  let selectedDistrict = localStorage.getItem('selectedDistrict');
  let selectedSubdistrict = localStorage.getItem('selectedSubdistrict');

  function getFromLocalStorage(key) {
    const item = localStorage.getItem(key);
    return item && item !== 'undefined' ? JSON.parse(item) : {};
  }

  let electoralDpr = getFromLocalStorage('electoralDpr');
  let electoralDpd = getFromLocalStorage('electoralDpd');
  let electoralDprdProvinsi = getFromLocalStorage('electoralDprdProvinsi');
  let electoralDprdKabupaten = getFromLocalStorage('electoralDprdKabupaten');

  const collapsibleElement = document.querySelectorAll('.collapsible');
  const collapsibleInstance = M.Collapsible.init(collapsibleElement, {
    accordion: false
  });

  let basePath = '';

  if (window.location.hostname.endsWith('.github.io')) {
    basePath = '/pemilu2024-dapil';
  }

  if (selectedProvince && selectedDistrict && selectedSubdistrict) {
    collapsibleInstance[0].close(0);
  } else {
    collapsibleInstance[0].open(0);
  }

  const navbarElement = document.querySelectorAll('.sidenav');
  const navInstance = M.Sidenav.init(navbarElement, {
    draggable: true
  });

  // navInstance[0].open();

  const floatingElement = document.querySelectorAll('.fixed-action-btn');
  const floatingInstance = M.FloatingActionButton.init(floatingElement);

  const floatingButton = document.getElementById('menu');
  floatingButton.addEventListener('click', function () {
    navInstance[0].open();
  });

  const tabs = document.querySelectorAll('.tabs');
  const tabsInstance = M.Tabs.init(tabs, {
    // swipeable: true
  });
  const tabsIndex = ['presiden', 'dpr', 'dpd', 'dprd_provinsi', 'dprd_kabupaten']

  const savedTabIndex = localStorage.getItem('activeTabIndex') || 0;
  tabsInstance[0].select(tabsIndex[savedTabIndex]);

  tabsInstance[0].options.onShow = function () {
    const activeTabIndex = tabsInstance[0].index;
    localStorage.setItem('activeTabIndex', activeTabIndex);
  };

  let parpol = []

  function populateOptionSelect(containerId, data, label, customName) {
    const selectElement = document.getElementById(containerId);
    selectElement.innerHTML = `<option value="" disabled selected>Select ${label}</option>`;

    data.sort((a, b) => a.name.localeCompare(b.name));
    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.text = customName ? updateDistrictName(item.name) : item.name;
      selectElement.add(option);
    });

    selectElement.disabled = false;
    M.FormSelect.init(selectElement);
    return selectElement;
  }

  function clearOptionSelect(containerId, label) {
    const selectElement = document.getElementById(containerId);
    selectElement.disabled = true;
    selectElement.innerHTML = `<option value="" disabled selected>Select ${label}</option>`;
    M.FormSelect.init(selectElement);
    return selectElement;
  }

  async function handleDistrictWithoutSubdistrict() {
    if (selectedProvince === '31') { // DKI JAKARTA
      localStorage.setItem('selectedProvince', selectedProvince);
      localStorage.setItem('selectedDistrict', selectedDistrict);
      localStorage.setItem('selectedSubdistrict', selectedSubdistrict);

      if (selectedProvince && selectedDistrict) {
        collapsibleInstance[0].close(0);
        await populateElectoralArea()
      }
      const container = document.getElementById('favoritesDprdKabupaten');
      container.style.display = 'none';

      return true;
    } else {
      const container = document.getElementById('favoritesDprdKabupaten');
      container.style.display = 'block';
      return false;
    }
  }

  async function saveSelectedElectorals() {
    localStorage.setItem('selectedProvince', selectedProvince);
    localStorage.setItem('selectedDistrict', selectedDistrict);
    localStorage.setItem('selectedSubdistrict', selectedSubdistrict);

    if (selectedProvince && selectedDistrict && selectedSubdistrict) {
      collapsibleInstance[0].close(0);
      await populateElectoralArea()
    }
  }

  fetch('data/parpol.json')
    .then(response => response.json())
    .then(data => {
      parpol = data;
      fetch('data/provinces.json')
        .then(response => response.json())
        .then(provinces => {
          const provincesSelect = populateOptionSelect('provinces', provinces, 'Province');

          if (!provincesSelect.hasEventListener) {
            provincesSelect.addEventListener('change', function () {
              provincesSelect.hasEventListener = true;
              if (this.value == "") return;
              selectedProvince = this.value;

              fetch(`data/provinces/${selectedProvince}.json`)
                .then(response => response.json())
                .then(districts => {
                  const districtsSelect = populateOptionSelect('districts', districts, 'District', true);
                  delete selectedDistrict;

                  clearOptionSelect('subdistricts', 'Subdistrict');
                  delete selectedSubdistrict;

                  if (!districtsSelect.hasEventListener) {
                    districtsSelect.addEventListener('change', async function () {
                      districtsSelect.hasEventListener = true;
                      if (this.value == "") return;
                      selectedDistrict = this.value;

                      if (await handleDistrictWithoutSubdistrict()) return;

                      fetch(`data/provinces/${selectedProvince}/districts/${selectedDistrict}.json`)
                        .then(response => response.json())
                        .then(subdistricts => {
                          const subdistrictsSelect = populateOptionSelect('subdistricts', subdistricts, 'Subdistrict');
                          subdistrictsSelect.disabled = false;

                          if (!subdistrictsSelect.hasEventListener) {
                            subdistrictsSelect.addEventListener('change', async function () {
                              subdistrictsSelect.hasEventListener = true;
                              if (this.value == "") return;
                              selectedSubdistrict = this.value;

                              await saveSelectedElectorals();
                            })

                            if (selectedSubdistrict) {
                              subdistrictsSelect.value = selectedSubdistrict;

                              const event = new Event('change');
                              subdistrictsSelect.dispatchEvent(event);
                            }
                          }
                        });
                    });

                    if (selectedDistrict) {
                      districtsSelect.value = selectedDistrict;

                      const event = new Event('change');
                      districtsSelect.dispatchEvent(event);
                    }
                  }
                });
            });
          }

          if (selectedProvince) {
            provincesSelect.value = selectedProvince;

            const event = new Event('change');
            provincesSelect.dispatchEvent(event);
          }
        });
    });

  const presCandidates = [
    {
      id: 1,
      photo: "https://i.ibb.co/qmN3XxP/anies-muhaimin.jpg",
      name: "H. ANIES RASYID BASWEDAN, Ph.D",
      runningMate: "H. A. MUHAIMIN ISKANDAR, Dr. (H.C.)",
      partyLogos: [
        "https://infopemilu.kpu.go.id/berkas-sipol/parpol/profil/gambar_parpol/1656224727_Logo%20NasDem%20KPU.png",
        "https://infopemilu.kpu.go.id/berkas-sipol/parpol/profil/gambar_parpol/1656538128_Logo%20PKB.png",
        "https://infopemilu.kpu.go.id/berkas-sipol/parpol/profil/gambar_parpol/1656395115_lambang_pks.png"
      ]
    },
    {
      id: 2,
      photo: "https://i.ibb.co/JzssdWy/prabowo-gibran.jpg",
      name: "H. PRABOWO SUBIANTO",
      runningMate: "GIBRAN RAKABUMING RAKA",
      partyLogos: [
        "https://infopemilu.kpu.go.id/berkas-sipol/parpol/profil/gambar_parpol/1657710596_Logo%20GERINDRA%2010x10.png",
        "https://infopemilu.kpu.go.id/berkas-sipol/parpol/profil/gambar_parpol/1656586681_Logo%20Golkar.png",
        "https://infopemilu.kpu.go.id/berkas-sipol/parpol/profil/gambar_parpol/1656229496_WhatsApp%20Image%202022-06-26%20at%201.53.14%20PM.png",
        "https://infopemilu.kpu.go.id/berkas-sipol/parpol/profil/gambar_parpol/1656404797_LOGO%20PAN.png",
        "https://infopemilu.kpu.go.id/berkas-sipol/parpol/profil/gambar_parpol/1656419883_logo-10x10.png",
        "https://infopemilu.kpu.go.id/berkas-sipol/parpol/profil/gambar_parpol/1659262742_LOGO%20PBB.png",
        "https://infopemilu.kpu.go.id/berkas-sipol/parpol/profil/gambar_parpol/1656406064_Logo%20Partai%20Garuda%20square.png"
      ]
    },
    {
      id: 3,
      photo: "https://i.ibb.co/r0bTMrk/ganjar-mahfud.jpg",
      name: "H. GANJAR PRANOWO, S.H., M.I.P.",
      runningMate: "Prof. Dr. H. M. MAHFUD MD",
      partyLogos: [
        "https://infopemilu.kpu.go.id/berkas-sipol/parpol/profil/gambar_parpol/1656305039_LOGO%20PDI%20PERJUANGAN.png",
        "https://infopemilu.kpu.go.id/berkas-sipol/parpol/profil/gambar_parpol/1658455987_Logo%20PPP.png",
        "https://infopemilu.kpu.go.id/berkas-sipol/parpol/profil/gambar_parpol/1659263373_hanura_10x10.png",
        "https://infopemilu.kpu.go.id/berkas-sipol/parpol/profil/gambar_parpol/1656144884_LOGO%20PARTAI%20PERINDO%2010x10%20cm%20(RGB).png"
      ]
    },
  ];

  let dprCandidates = [];

  let dpdCandidates = [];

  let dprdProvinsiCandidates = [];

  let dprdKabupatenCandidates = [];

  function showToast(message) {
    if (window.innerWidth <= 600) {
      M.toast({ html: message });
    }
  }

  function clearCandidates() {
    const containerIds = [
      "presiden-candidates",
      "dpr-candidates",
      "dpd-candidates",
      "dprd_provinsi-candidates",
      "dprd_kabupaten-candidates",
    ];

    containerIds.forEach((containerId) => {
      const container = document.getElementById(containerId);
      container.innerHTML = '';
    });
  }

  async function init() {
    clearCandidates();

    await generateCandidatePresidenCards();
    await generateCandidateDprCards();
    await generateCandidateDpdCards();
    await generateCandidateDprdProvinsiCards();
    await generateCandidateDprdKabupatenCards();

    displayFavorites();
  }

  async function populateElectoralArea() {
    const electoralsResponse = await fetch('data/electorals.json');
    const electorals = await electoralsResponse.json();

    const provincesResponse = await fetch('data/provinces.json');
    const provinces = await provincesResponse.json();

    electoralDpr = electorals.find(
      (electoral) => electoral.jenis_dapil === 'DPR RI' && electoral.kode_wilayah === selectedDistrict
    );

    electoralDpd = provinces.find((province) => province.id == selectedProvince);

    electoralDprdProvinsi = electorals.find(
      (electoral) =>
        electoral.jenis_dapil === 'DPRD PROVINSI' &&
        electoral.kode_wilayah === selectedDistrict
    );
    if (electoralDprdProvinsi && electoralDprdProvinsi.is_pecah) {
      electoralDprdProvinsi = electorals.find(
        (electoral) => electoral.kode_wilayah === selectedSubdistrict
      );
    }

    electoralDprdKabupaten = electorals.find(
      (electoral) =>
        electoral.jenis_dapil === 'DPRD KABUPATEN/KOTA' &&
        electoral.kode_wilayah === selectedSubdistrict &&
        !electoral.is_pecah
    );

    await setLocalStorageAndInit();
  }

  async function setLocalStorageAndInit() {
    localStorage.setItem('electoralDpr', JSON.stringify(electoralDpr));
    localStorage.setItem('electoralDpd', JSON.stringify(electoralDpd));
    localStorage.setItem('electoralDprdProvinsi', JSON.stringify(electoralDprdProvinsi));
    localStorage.setItem('electoralDprdKabupaten', JSON.stringify(electoralDprdKabupaten));

    await init();
  }

  function groupCandidatesByParty(parpol, candidates) {
    const groupedCandidates = candidates.reduce((result, candidate) => {
      const idPartai = candidate.id_partai;

      if (!result[idPartai]) {
        result[idPartai] = [];
      }

      const candidateWithId = {
        ...candidate,
        id: parseInt(`${candidate.kode_dapil}${candidate.id_partai}${candidate.nomor_urut}`),
      };

      result[idPartai].push(candidateWithId);

      return result;
    }, {});

    return parpol.map((party) => ({
      ...party,
      candidates: groupedCandidates[party.id] || [],
    }));
  }

  async function generateCandidatePresidenCards() {
    const container = document.getElementById("presiden-candidates");

    presCandidates.forEach((candidate) => {
      const card = createPresidenCard(candidate);
      container.appendChild(card);
    });
  }

  function createCandidateInfoRow(label, value) {
    return `
      <div class="col s6" style="text-align: center; padding-right: 5px;">
        <label class="truncate" style="font-size: 8px">${label}</label>
        <span class="candidate-name-title" style="margin-top:2px">${value}</span>
      </div>
    `;
  }

  function createPartyLogos(logos) {
    return logos.map(
      (logo) => `
        <img
          src="https://placehold.co/20x20"
          data-src="${logo}"
          alt="${logo}"
          class="lazyload parpol-image"
          style="margin: 1px; width: 20px; height: 20px; object-fit: contain;"
        >
      `
    ).join('');
  }

  function createPresidenCard(candidate) {
    const card = document.createElement("div");
    card.className = "col s12 m4 l4";
    card.innerHTML = `
      <div class="card custom-card" id="card-presiden-candidates-${candidate.id}" onclick="showProfilePresiden(${candidate.id})">
        <a id="toggleButton-presiden-candidates-${candidate.id}" href="javascript:void(0);">
          <i class="material-icons bookmark-icon" style="color: transparent;">star</i>
        </a>
        <div style="text-align: center; padding: 10px 0;">
          <h3 style="margin: 0;">${candidate.id}</h3>
        </div>
        <div class="card-image">
          <img
            src="https://placehold.co/600x450"
            data-src="${candidate.photo}"
            alt="${candidate.name}"
            class="lazyload"
            width="100%"
          >
        </div>
        <div class="card-content" style="padding: 24px 0;">
          <div class="row">
            ${createCandidateInfoRow("CALON PRESIDEN", candidate.name)}
            ${createCandidateInfoRow("CALON WAKIL PRESIDEN", candidate.runningMate)}
          </row>
          <div class="row">
            <div class="col s12" style="text-align: center; margin-top: 20px;">
              <label style="font-size: 8px; display: block; margin-bottom: 5px;">GABUNGAN PARTAI POLITIK PENGUSUL</label>
              ${createPartyLogos(candidate.partyLogos)}
            </div>
          </div>
        </div>
      </div>
    `;
    return card;
  }

  async function generateCandidateDpdCards() {
    const container = document.getElementById("dpd-candidates");

    if (electoralDpd) {
      const candidateResponse = await fetch(`data/dpd/${electoralDpd.id}.json`);
      dpdCandidates = await candidateResponse.json();
      dpdCandidates.forEach((candidate) => {
        candidate.id = parseInt(`${candidate.kode_propinsi}${candidate.nomor_urut}`);
      });
    }

    dpdCandidates.forEach((candidate) => {
      const card = createDpdCard(candidate);
      container.appendChild(card);
    });
  }

  function createDpdCard(candidate) {
    const card = document.createElement("div");
    card.className = "col s4 m3 l2";
    card.innerHTML = `
      <div class="card custom-card" id="card-dpd-candidates-${candidate.id}" onclick="showProfileDpd(${candidate.id})">
        <a id="toggleButton-dpd-candidates-${candidate.id}" href="javascript:void(0);">
          <i class="material-icons bookmark-icon" style="color: transparent;">star</i>
        </a>
        <div style="text-align: center; display: flex; align-items: center; justify-content: center; width: 100%; margin-bottom: 10px;">
          <h5 style="margin: 0;">${candidate.nomor_urut}</h5>
        </div>
        <div class="card-image">
          <div style="display: flex; justify-content: center; align-items: center;">
            <img
              src="https://placehold.co/60x90"
              data-src="${candidate.foto}"
              alt="${candidate.nama}"
              class="lazyload"
              style="width: 60px; height: 90px; object-fit: contain;"
            >
          </div>
        </div>
        <div class="card-content card-candidate">
          <span class="candidate-name-large">${candidate.nama}</span>
        </div>
      </div>
    `;
    return card;
  }

  async function generateCandidateCards(containerId, dataUrl, onClickHandler) {
    const container = document.getElementById(containerId);

    if (!container) {
      return;
    }

    const response = await fetch(dataUrl);

    if (!response.ok) {
      return;
    }

    const candidates = groupCandidatesByParty(parpol, await response.json());

    let maxCandidates = 0;

    candidates.forEach((data) => {
      maxCandidates = Math.max(maxCandidates, data.candidates.length);
    });

    candidates.forEach((data) => {
      if (data.candidates.length === 0) return;

      const card = createCandidateCard(containerId, data, maxCandidates, onClickHandler);
      container.appendChild(card);
    });

    return candidates;
  }

  function extractCategoryFromContainerId(containerId) {
    return containerId.split('-')[0];
  }

  function createCandidateCard(containerId, data, maxCandidates, onClickHandler) {
    const category = extractCategoryFromContainerId(containerId);

    const card = document.createElement('div');
    card.className = 'col s6 m4 l3';
    card.innerHTML = `
      <div class="card">
        <div style="text-align: center; padding: 10px 0;">
          <div class="parpol-item">
            <span class="parpol-number">${data.nomor_urut}</span>
            <img
              src="https://placehold.co/50x50"
              data-src="${data.foto}"
              alt="${data.nama}"
              class="lazyload parpol-image"
              style="width: 45px; height: 45px; object-fit: contain;"
            >
            <span class="parpol-name">${data.nama}</span>
          </div>
        </div>
        <div class="card-content card-candidate">
          <ul class="collection">
            ${data.candidates.map(candidate => `
              <li class="collection-item candidate-item custom-collection" id="card-${category}-${candidate.id}" onclick="${onClickHandler}(${candidate.id})">
                <span class="candidate-number">${candidate.nomor_urut}.</span>
                <span class="candidate-name">${candidate.nama}</span>
                <a id="toggleButton-${category}-${candidate.id}" href="javascript:void(0);" style="float: right;">
                  <i class="material-icons bookmark-icon" style="color: transparent;">star</i>
                </a>
              </li>
            `).join('')}
            ${Array.from({ length: maxCandidates - data.candidates.length }, (_, index) => `
              <li class="collection-item candidate-item empty-collection">
                <span class="candidate-number">&nbsp;</span>
                <span class="candidate-name">&nbsp;</span>
                <a href="javascript:void(0);" style="float: right;">
                  <i class="material-icons bookmark-icon" style="color: transparent;">star</i>
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;

    return card;
  }

  async function generateCandidateDprCards() {
    dprCandidates = await generateCandidateCards("dpr-candidates", `data/dpr/${electoralDpr.kode_dapil}.json`, "showProfileDpr");
  }

  async function generateCandidateDprdProvinsiCards() {
    dprdProvinsiCandidates = await generateCandidateCards("dprd_provinsi-candidates", `data/dprdprov/${electoralDprdProvinsi.kode_dapil}.json`, "showProfileDprdProvinsi");
  }

  async function generateCandidateDprdKabupatenCards() {
    dprdKabupatenCandidates = await generateCandidateCards("dprd_kabupaten-candidates", `data/dprdkk/${electoralDprdKabupaten.kode_dapil}.json`, "showProfileDprdKabupaten");
  }

  function closeModal() {
    const modal = document.getElementById('modal-profile');
    const modalInstance = M.Modal.getInstance(modal);

    modalInstance.close();
  }

  function eventBehavior(category, data) {
    const label = data[0];
    if (typeof gtag === 'function' && label) {
      gtag('event', 'click', {
        'event_category': category,
        'event_action': 'click',
        'event_label': `${category}-${label}`
      });
    }
  }

  window.toggleFavoritePresiden = function (candidateId) {
    const index = favoritesPresiden.indexOf(candidateId);
    let candidate = presCandidates.find(c => c.id === candidateId);
    if (index === -1) {
      favoritesPresiden = [candidateId];
      showToast(`${candidate.name} ditambahkan ke favorit.`);
    } else {
      favoritesPresiden.splice(index, 1);
      showToast(`${candidate.name} dihapus dari favorit.`);
    }

    localStorage.setItem('favoritesPresiden', JSON.stringify(favoritesPresiden));
    eventBehavior('card-presiden', favoritesPresiden);

    displayFavoritesPresiden();

    closeModal();
  };

  window.toggleFavoriteDpr = function (candidateId) {
    const index = favoritesDpr.indexOf(candidateId);

    let candidate;

    dprCandidates.forEach(party => {
      const foundCandidate = party.candidates.find(c => c.id === candidateId);

      if (foundCandidate) {
        candidate = foundCandidate;
      }
    });

    if (index === -1) {
      favoritesDpr = [candidateId];
      showToast(`${candidate.nama} ditambahkan ke favorit.`);
    } else {
      favoritesDpr.splice(index, 1);
      showToast(`${candidate.nama} dihapus dari favorit.`);
    }

    localStorage.setItem('favoritesDpr', JSON.stringify(favoritesDpr));
    eventBehavior('card-dpr', favoritesDpr);

    displayFavoritesDpr();

    closeModal();
  };

  window.toggleFavoriteDpd = function (candidateId) {
    const index = favoritesDpd.indexOf(candidateId);
    let candidate = dpdCandidates.find(c => c.id === candidateId);
    if (index === -1) {
      favoritesDpd = [candidateId];
      showToast(`${candidate.nama} ditambahkan ke favorit.`);
    } else {
      favoritesDpd.splice(index, 1);
      showToast(`${candidate.nama} dihapus dari favorit.`);
    }

    localStorage.setItem('favoritesDpd', JSON.stringify(favoritesDpd));
    eventBehavior('card-dpd', favoritesDpd);

    displayFavoritesDpd();

    closeModal();
  };

  window.toggleFavoriteDprdProvinsi = function (candidateId) {
    const index = favoritesDprdProvinsi.indexOf(candidateId);

    let candidate;
    dprdProvinsiCandidates.forEach(party => {
      const foundCandidate = party.candidates.find(c => c.id === candidateId);

      if (foundCandidate) {
        candidate = foundCandidate;
      }
    });

    if (index === -1) {
      favoritesDprdProvinsi = [candidateId];
      showToast(`${candidate.nama} ditambahkan ke favorit.`);
    } else {
      favoritesDprdProvinsi.splice(index, 1);
      showToast(`${candidate.nama} dihapus dari favorit.`);
    }

    localStorage.setItem('favoritesDprdProvinsi', JSON.stringify(favoritesDprdProvinsi));
    eventBehavior('card-dprdprov', favoritesDprdProvinsi);

    displayFavoritesDprdProvinsi();

    closeModal();
  };

  window.toggleFavoriteDprdKabupaten = function (candidateId) {
    const index = favoritesDprdKabupaten.indexOf(candidateId);

    let candidate;
    dprdKabupatenCandidates.forEach(party => {
      const foundCandidate = party.candidates.find(c => c.id === candidateId);

      if (foundCandidate) {
        candidate = foundCandidate;
      }
    });

    if (index === -1) {
      favoritesDprdKabupaten = [candidateId];
      showToast(`${candidate.nama} ditambahkan ke favorit.`);
    } else {
      favoritesDprdKabupaten.splice(index, 1);
      showToast(`${candidate.nama} dihapus dari favorit.`);
    }

    localStorage.setItem('favoritesDprdKabupaten', JSON.stringify(favoritesDprdKabupaten));
    eventBehavior('card-dprdkab', favoritesDprdKabupaten);

    displayFavoritesDprdKabupaten();

    closeModal();
  };

  function updateButtonAndCard(candidate, category, favorites, isCollection) {
    favorites.forEach(favoriteId => {
      if (candidate.id !== favoriteId) {
        const otherButton = document.getElementById(`toggleButton-${category}-${candidate.id}`);
        if (otherButton) {
          otherButton.innerHTML = '<i class="material-icons bookmark-icon transparent">star</i>';
        }

        const otherCard = document.getElementById(`card-${category}-${candidate.id}`);
        if (otherCard) {
          otherCard.classList.toggle(isCollection ? 'active-collection' : 'active-card', false);
        }
      }
    });

    const button = document.getElementById(`toggleButton-${category}-${candidate.id}`);
    if (button) {
      const index = favorites.indexOf(candidate.id);
      if (index === -1) {
        button.innerHTML = '<i class="material-icons bookmark-icon" style="color: transparent;">star</i>';
      } else {
        button.innerHTML = '<i class="material-icons bookmark-icon" style="color: red;">star_border</i>';
      }
    }

    const card = document.getElementById(`card-${category}-${candidate.id}`);
    if (card) {
      const index = favorites.indexOf(candidate.id);
      if (index === -1) {
        card.classList.toggle(isCollection ? 'active-collection' : 'active-card', false);
      } else {
        card.classList.toggle(isCollection ? 'active-collection' : 'active-card', true);
      }
    }
  }

  function updatePresidenButtonText() {
    presCandidates.forEach(candidate => {
      updateButtonAndCard(candidate, 'presiden-candidates', favoritesPresiden, false);
    });
  }

  function updateDprButtonText() {
    const category = extractCategoryFromContainerId("dpr-candidates");

    dprCandidates.forEach(party => {
      party.candidates.forEach(candidate => {
        updateButtonAndCard(candidate, category, favoritesDpr, true);
      });
    });
  }

  function updateDpdButtonText() {
    dpdCandidates.forEach(candidate => {
      updateButtonAndCard(candidate, 'dpd-candidates', favoritesDpd, false);
    });
  }

  function updateDprdProvinsiButtonText() {
    const category = extractCategoryFromContainerId("dprd_provinsi-candidates");

    dprdProvinsiCandidates.forEach(party => {
      party.candidates.forEach(candidate => {
        updateButtonAndCard(candidate, category, favoritesDprdProvinsi, true);
      });
    });
  }

  function updateDprdKabupatenButtonText() {
    const category = extractCategoryFromContainerId("dprd_kabupaten-candidates");

    dprdKabupatenCandidates.forEach(party => {
      party.candidates.forEach(candidate => {
        updateButtonAndCard(candidate, category, favoritesDprdKabupaten, true);
      });
    });
  }

  function displayFavorites() {
    displayFavoritesPresiden();
    displayFavoritesDpr();
    displayFavoritesDpd();
    displayFavoritesDprdProvinsi();
    displayFavoritesDprdKabupaten();
    displayHeader();
  }

  function updateDistrictName(strName) {
    if (strName && !strName.startsWith("KOTA")) {
      strName = "KAB. " + strName;
    }

    return strName;
  }

  async function displayHeader() {
    const setElementInnerHTML = (elementId, value) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.innerHTML = value;
      }
    };

    setElementInnerHTML('electoral-dpr', electoralDpr?.nama_dapil);
    setElementInnerHTML('electoral-dpd', electoralDpd?.name);
    setElementInnerHTML('electoral-dprd-prov', electoralDprdProvinsi?.nama_dapil);
    setElementInnerHTML('electoral-dprd-kk', electoralDprdKabupaten?.nama_dapil);

    const provincesResponse = await fetch('data/provinces.json');
    const provinces = await provincesResponse.json();
    const province = provinces.find(province => province.id == selectedProvince);
    setElementInnerHTML('electoral-province', province?.name);

    const districtsResponse = await fetch(`data/provinces/${selectedProvince}.json`);
    const districts = await districtsResponse.json();
    const district = districts.find(district => district.id == selectedDistrict);
    setElementInnerHTML('electoral-district', updateDistrictName(district?.name));
  }

  function displayFavoritesPresiden() {
    const favoritesContainer = document.getElementById('favoritesPresiden');
    favoritesContainer.innerHTML = '';

    if (favoritesPresiden.length > 0) {
      favoritesContainer.innerHTML = `
        <div class="collection-header"><label>PRESIDEN DAN WAKIL PRESIDEN</label></div>
      `;
      favoritesPresiden.forEach(favoriteId => {
        const favoriteCandidate = presCandidates.find(candidate => candidate.id === favoriteId);
        if (favoriteCandidate) {
          const collectionItem = document.createElement('div');
          collectionItem.className = 'collection-item avatar';
          collectionItem.innerHTML = `
            <div class="card horizontal" style="margin: 0;">
              <div class="card-stacked">
                <div class="card-content card-small card-profile" onclick="showProfilePresiden(${favoriteCandidate.id})">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center;">
                      <img src="${favoriteCandidate.photo}" alt="${favoriteCandidate.name}" style="width: 45px; height: 45px; object-fit: contain;">
                      <span class="candidate-name-title" style="text-align: left; margin-left: 8px;">${favoriteCandidate.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;

          favoritesContainer.appendChild(collectionItem);
        }
      });
    } else {
      favoritesContainer.innerHTML = `
        <div class="collection-header"><label>PRESIDEN DAN WAKIL PRESIDEN</label></div>
        <div class="collection-item empty-selection">
          <div class="card horizontal" style="margin: 0">
            <div class="card-stacked">
              <div class="card-content card-small">
                <p class="center-align" style="color: rgb(211,211,211);">PILIH KANDIDATMU</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    updatePresidenButtonText();
  }

  function displayFavoritesDpr() {
    const favoritesContainer = document.getElementById('favoritesDpr');
    favoritesContainer.innerHTML = '';

    if (favoritesDpr.length > 0) {
      favoritesContainer.innerHTML = `
        <div class="collection-header truncate"><label>DPR ${electoralDpr?.nama_dapil}</label></div>
      `;
      favoritesDpr.forEach(favoriteId => {
        let favoriteCandidate;
        dprCandidates.forEach(party => {
          const foundCandidate = party.candidates.find(c => c.id === favoriteId);
          if (foundCandidate) {
            favoriteCandidate = foundCandidate;
          }
        });

        if (favoriteCandidate) {
          const collectionItem = document.createElement('div');
          collectionItem.className = 'collection-item avatar';
          collectionItem.innerHTML = `
            <div class="card horizontal" style="margin: 0;">
              <div class="card-stacked">
                <div class="card-content card-small card-profile" onclick="showProfileDpr(${favoriteCandidate.id})">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center;">
                      <img src="${favoriteCandidate.foto}" alt="${favoriteCandidate.nama}" style="width: 45px; height: 45px; object-fit: contain;">
                      <span class="candidate-name-title" style="text-align: left; margin-left: 8px;">${favoriteCandidate.nama}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;

          favoritesContainer.appendChild(collectionItem);
        } else {
          favoritesContainer.innerHTML = `
            <div class="collection-header truncate"><label>DPR ${electoralDpr?.nama_dapil}</label></div>
            <div class="collection-item empty-selection">
              <div class="card horizontal" style="margin: 0">
                <div class="card-stacked">
                  <div class="card-content card-small">
                    <p class="center-align" style="color: rgb(211,211,211);">PILIH KANDIDATMU</p>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
      });
    } else {
      favoritesContainer.innerHTML = `
        <div class="collection-header truncate"><label>DPR ${electoralDpr?.nama_dapil}</label></div>
        <div class="collection-item empty-selection">
          <div class="card horizontal" style="margin: 0">
            <div class="card-stacked">
              <div class="card-content card-small">
                <p class="center-align" style="color: rgb(211,211,211);">PILIH KANDIDATMU</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    updateDprButtonText();
  }

  function displayFavoritesDpd() {
    const favoritesContainer = document.getElementById('favoritesDpd');
    favoritesContainer.innerHTML = '';

    if (favoritesDpd.length > 0) {
      favoritesContainer.innerHTML = `
        <div class="collection-header truncate"><label>DPD ${electoralDpd?.name}</label></div>
      `;
      favoritesDpd.forEach(favoriteId => {
        const favoriteCandidate = dpdCandidates.find(candidate => candidate.id === favoriteId);
        if (favoriteCandidate) {
          const collectionItem = document.createElement('div');
          collectionItem.className = 'collection-item avatar';
          collectionItem.innerHTML = `
            <div class="card horizontal" style="margin: 0;">
              <div class="card-stacked">
                <div class="card-content card-small card-profile" onclick="showProfileDpd(${favoriteCandidate.id})">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center;">
                      <img src="${favoriteCandidate.foto}" alt="${favoriteCandidate.nama}" style="width: 45px; height: 45px; object-fit: contain;">
                      <span class="candidate-name-title" style="text-align: left; margin-left: 8px;">${favoriteCandidate.nama}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;

          favoritesContainer.appendChild(collectionItem);
        } else {
          favoritesContainer.innerHTML = `
            <div class="collection-header truncate"><label>DPD ${electoralDpd?.name}</label></div>
            <div class="collection-item empty-selection">
              <div class="card horizontal" style="margin: 0">
                <div class="card-stacked">
                  <div class="card-content card-small">
                    <p class="center-align" style="color: rgb(211,211,211);">PILIH KANDIDATMU</p>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
      });
    } else {
      favoritesContainer.innerHTML = `
        <div class="collection-header truncate"><label>DPD ${electoralDpd?.name}</label></div>
        <div class="collection-item empty-selection">
          <div class="card horizontal" style="margin: 0">
            <div class="card-stacked">
              <div class="card-content card-small">
                <p class="center-align" style="color: rgb(211,211,211);">PILIH KANDIDATMU</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    updateDpdButtonText();
  }

  function displayFavoritesDprdProvinsi() {
    const favoritesContainer = document.getElementById('favoritesDprdProvinsi');
    favoritesContainer.innerHTML = '';

    if (favoritesDprdProvinsi.length > 0) {
      favoritesContainer.innerHTML = `
        <div class="collection-header truncate"><label>DPRD PROVINSI ${electoralDprdProvinsi?.nama_dapil}</label></div>
      `;
      favoritesDprdProvinsi.forEach(favoriteId => {
        let favoriteCandidate;
        dprdProvinsiCandidates.forEach(party => {
          const foundCandidate = party.candidates.find(c => c.id === favoriteId);
          if (foundCandidate) {
            favoriteCandidate = foundCandidate;
          }
        });

        if (favoriteCandidate) {
          const collectionItem = document.createElement('div');
          collectionItem.className = 'collection-item avatar';
          collectionItem.innerHTML = `
            <div class="card horizontal" style="margin: 0;">
              <div class="card-stacked">
                <div class="card-content card-small card-profile" onclick="showProfileDprdProvinsi(${favoriteCandidate.id})">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center;">
                      <img src="${favoriteCandidate.foto}" alt="${favoriteCandidate.nama}" style="width: 45px; height: 45px; object-fit: contain;">
                      <span class="candidate-name-title" style="text-align: left; margin-left: 8px;">${favoriteCandidate.nama}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;

          favoritesContainer.appendChild(collectionItem);
        } else {
          favoritesContainer.innerHTML = `
            <div class="collection-header truncate"><label>DPRD PROVINSI ${electoralDprdProvinsi?.nama_dapil}</label></div>
            <div class="collection-item empty-selection">
              <div class="card horizontal" style="margin: 0">
                <div class="card-stacked">
                  <div class="card-content card-small">
                    <p class="center-align" style="color: rgb(211,211,211);">PILIH KANDIDATMU</p>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
      });
    } else {
      favoritesContainer.innerHTML = `
        <div class="collection-header truncate"><label>DPRD PROVINSI ${electoralDprdProvinsi?.nama_dapil}</label></div>
        <div class="collection-item empty-selection">
          <div class="card horizontal" style="margin: 0">
            <div class="card-stacked">
              <div class="card-content card-small">
                <p class="center-align" style="color: rgb(211,211,211);">PILIH KANDIDATMU</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    updateDprdProvinsiButtonText();
  }

  function displayFavoritesDprdKabupaten() {
    const favoritesContainer = document.getElementById('favoritesDprdKabupaten');
    favoritesContainer.innerHTML = '';

    if (favoritesDprdKabupaten.length > 0) {
      favoritesContainer.innerHTML = `
        <div class="collection-header truncate"><label>DPRD KAB/KOTA ${electoralDprdKabupaten?.nama_dapil}</label></div>
      `;
      favoritesDprdKabupaten.forEach(favoriteId => {
        let favoriteCandidate;
        dprdKabupatenCandidates.forEach(party => {
          const foundCandidate = party.candidates.find(c => c.id === favoriteId);
          if (foundCandidate) {
            favoriteCandidate = foundCandidate;
          }
        });

        if (favoriteCandidate) {
          const collectionItem = document.createElement('div');
          collectionItem.className = 'collection-item avatar';
          collectionItem.innerHTML = `
            <div class="card horizontal" style="margin: 0;">
              <div class="card-stacked">
                <div class="card-content card-small card-profile" onclick="showProfileDprdKabupaten(${favoriteCandidate.id})">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center;">
                      <img src="${favoriteCandidate.foto}" alt="${favoriteCandidate.nama}" style="width: 45px; height: 45px; object-fit: contain;">
                      <span class="candidate-name-title" style="text-align: left; margin-left: 8px;">${favoriteCandidate.nama}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;

          favoritesContainer.appendChild(collectionItem);
        } else {
          favoritesContainer.innerHTML = `
            <div class="collection-header truncate"><label>DPRD KAB/KOTA ${electoralDprdKabupaten?.nama_dapil}</label></div>
            <div class="collection-item empty-selection">
              <div class="card horizontal" style="margin: 0">
                <div class="card-stacked">
                  <div class="card-content card-small">
                    <p class="center-align" style="color: rgb(211,211,211);">PILIH KANDIDATMU</p>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
      });
    } else {
      favoritesContainer.innerHTML = `
        <div class="collection-header truncate"><label>DPRD KAB/KOTA ${electoralDprdKabupaten?.nama_dapil}</label></div>
        <div class="collection-item empty-selection">
          <div class="card horizontal" style="margin: 0">
            <div class="card-stacked">
              <div class="card-content card-small">
                <p class="center-align" style="color: rgb(211,211,211);">PILIH KANDIDATMU</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    updateDprdKabupatenButtonText();
  }

  function showProfile(candidateType, favoriteId, favoriteCandidate, candidates, electoralData) {
    let candidate;
    let party;

    if (candidateType === 'Dct_dpd' || candidateType === 'Presiden') {
      candidate = candidates.find(candidate => candidate.id === favoriteId);
    } else {
      candidate = findCandidateById(favoriteId, candidates);
    }
    party = findPartyById(candidate.id_partai);

    const electoral = electoralData;

    const modalProfile = document.getElementById('modal-profile');
    modalProfile.innerHTML = generateProfileHtml(candidateType, candidate, favoriteCandidate, party, electoral);

    const elems = document.querySelectorAll('.modal');
    const instances = M.Modal.init(elems);
    instances[0].open();
  }

  function findCandidateById(candidateId, candidates) {
    let candidate;
    candidates.forEach(party => {
      const foundCandidate = party.candidates.find(c => c.id === candidateId);
      if (foundCandidate) {
        candidate = foundCandidate;
      }
    });
    return candidate;
  }

  function findPartyById(partyId) {
    return parpol.find(p => p.id === partyId);
  }

  function generateProfileHtml(candidateType, candidate, favoriteCandidate, party, electoral) {
    if (candidateType === 'Presiden') {
      return `
        <div class="modal-content">
          <div class="modal-footer">
            <a href="#!" class="modal-close waves-effect waves-green btn-flat">Tutup</a>
          </div>
          <div class="card horizontal" style="margin: 0;">
            <div class="card-stacked">
              <div class="card-content card-small">
                <div class="row">
                  <div class="col s12 m2 l2">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <img
                        src="https://placehold.co/90x60"
                        data-src="${candidate.photo}"
                        alt="${candidate.name}"
                        class="lazyload"
                        style="width: 120px; height: 180px; object-fit: contain; margin: auto; display: block;"
                      >
                    </div>
                  </div>
                  <div class="col s12 m10 l10">
                    <ul class="collection">
                      <li class="collection-item">No. Urut Ke-${candidate.id}</li>
                      <li class="collection-item"><span class="new badge">Calon Presiden</span>${candidate.name}</li>
                      <li class="collection-item"><span class="new badge">Calon Wakil Presiden</span>${candidate.runningMate}</li>
                      <li class="collection-item">
                        <div style="display: flex; justify-content: center;">
                          <a class="waves-effect waves-light btn green" href="https://infopemilu.kpu.go.id/Pemilu/Pwp/Pengundian_nomor_urut" target="_blank" style="margin: 0 5px;">
                            Pelajari
                          </a>
                          <a class="waves-effect waves-light btn ${favoriteCandidate.indexOf(candidate.id) === -1 ? 'green' : 'red'}" href="javascript:void(0);" onclick="toggleFavoritePresiden(${candidate.id})" style="margin: 0 5px;">
                            ${favoriteCandidate.indexOf(candidate.id) === -1 ? 'Simpan' : 'Hapus'}
                          </a>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const profileExists = Object.keys(candidate.profile).length !== 0;

    return `
      <div class="modal-content">
        <div class="modal-footer">
          <a href="#!" class="modal-close waves-effect waves-green btn-flat">Tutup</a>
        </div>
        <div class="card horizontal" style="margin: 0;">
          <div class="card-stacked">
            <div class="card-content card-small">
              <div class="row">
                <div class="col s12 m6 l7">
                  <div class="row">
                    <div class="col s12 m2 l2">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <img
                          src="https://placehold.co/90x60"
                          data-src="${candidate.foto}"
                          alt="${candidate.nama}"
                          class="lazyload"
                          style="width: 120px; height: 180px; object-fit: contain; margin: auto; display: block;"
                        >
                      </div>
                    </div>
                    <div class="col s12 m10 l10">
                      <ul class="collection">
                        ${party ? `
                          <li class="collection-item">
                            <div class="parpol-item">
                              <h4 class="parpol-number">${party.nomor_urut}</h4>
                              <img
                                src="https://placehold.co/50x50"
                                data-src="${party.foto}"
                                alt="${party.nama}"
                                class="lazyload parpol-image"
                                style="width: 45px; height: 45px; object-fit: contain;"
                              >
                              <span>${party.nama}</span>
                            </div>
                          </li>
                        ` : ``}
                        <li class="collection-item">No. Urut Ke-${candidate.nomor_urut}</li>
                        <li class="collection-item">${candidate.nama}</li>
                        <li class="collection-item"><span class="new badge">Alamat Kandidat</span>${candidate.alamat_kabko}</li>
                        ${generateProfileLinkHtml(candidateType, candidate.id, favoriteCandidate, profileExists)}
                      </ul>
                    </div>
                  </div>
                </div>
                <div class="col s12 m6 l5">
                  <ul class="collection">
                    ${candidateType === 'Dct_dpd' ? `
                      <li class="collection-item">DPD RI</li>
                      <li class="collection-item"><span class="new badge">Daerah Pemilihan</span>${electoral.name}</li>
                    ` : `
                      <li class="collection-item">${electoral.jenis_dapil}</li>
                      <li class="collection-item"><span class="new badge">Daerah Pemilihan</span>${electoral.nama_dapil}</li>
                      <li class="collection-item">${electoral.tingkatan_wilayah}</li>
                      <li class="collection-item"><span class="new badge">Wilayah</span>${electoral.nama}</li>
                    ` }
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function generateProfileLinkHtml(candidateType, candidateId, favoriteCandidate, profileExists) {
    const getToggleFunction = (type) => {
      switch (type) {
        case 'Presiden':
          return "toggleFavoritePresiden";
        case 'Dct_dpr':
          return "toggleFavoriteDpr";
        case 'Dct_dpd':
          return "toggleFavoriteDpd";
        case 'Dct_dprprov':
          return "toggleFavoriteDprdProvinsi";
        case 'Dct_dprd':
          return "toggleFavoriteDprdKabupaten";
        default:
          return null;
      }
    };

    const toggleFunction = getToggleFunction(candidateType);

    if (!toggleFunction) {
      return ''; // handle unsupported candidateType
    }

    const isFavorite = favoriteCandidate.indexOf(candidateId) !== -1;
    const buttonText = isFavorite ? 'Hapus' : 'Simpan';
    const buttonColor = isFavorite ? 'red' : 'green';

    return `
      <li class="collection-item">
        <div style="display: flex; justify-content: center;">
          ${profileExists ? `
            <a class="waves-effect waves-light btn green" onclick="openProfile('${candidateType}', ${candidateId})" target="_blank">
              Profil Calon
            </a>
          ` : ``}
          <a class="waves-effect waves-light btn ${buttonColor}" href="javascript:void(0);" onclick="${toggleFunction}(${candidateId})" style="margin: 0 5px;">
            ${buttonText}
          </a>
        </div>
        ${!profileExists ? generateProfileUnavailableHtml() : ``}
      </li>
    `;
  }

  function generateProfileUnavailableHtml() {
    return `
      <small>
        <i>Calon tidak bersedia mempublikasikan profil.</i>
      </small>
    `;
  }

  window.showProfilePresiden = function (favoriteId) {
    showProfile('Presiden', favoriteId, favoritesPresiden, presCandidates);
  }

  window.showProfileDpr = function (favoriteId) {
    showProfile('Dct_dpr', favoriteId, favoritesDpr, dprCandidates, electoralDpr);
  };

  window.showProfileDpd = function (favoriteId) {
    showProfile('Dct_dpd', favoriteId, favoritesDpd, dpdCandidates, electoralDpd);
  };

  window.showProfileDprdProvinsi = function (favoriteId) {
    showProfile('Dct_dprprov', favoriteId, favoritesDprdProvinsi, dprdProvinsiCandidates, electoralDprdProvinsi);
  };

  window.showProfileDprdKabupaten = function (favoriteId) {
    showProfile('Dct_dprd', favoriteId, favoritesDprdKabupaten, dprdKabupatenCandidates, electoralDprdKabupaten);
  };

  window.openProfile = function (candidateType, favoriteId) {
    const form = document.createElement('form');
    form.action = `https://infopemilu.kpu.go.id/Pemilu/${candidateType}/profile`;
    form.method = 'POST';
    form.target = '_blank';

    let favoriteCandidate;

    if (candidateType === 'Dct_dpd') {
      favoriteCandidate = dpdCandidates.find(candidate => candidate.id === favoriteId);
    } else if (candidateType === 'Dct_dpr') {
      favoriteCandidate = findCandidateById(favoriteId, dprCandidates);
    } else if (candidateType === 'Dct_dprprov') {
      favoriteCandidate = findCandidateById(favoriteId, dprdProvinsiCandidates);
    } else if (candidateType === 'Dct_dprd') {
      favoriteCandidate = findCandidateById(favoriteId, dprdKabupatenCandidates);
    }

    const { profile } = favoriteCandidate;

    Object.entries(profile).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'text';
      input.name = key;
      input.value = value;

      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  const tapElement = document.querySelectorAll('.tap-target');
  const tapInstance = M.TapTarget.init(tapElement);
  if (!selectedProvince && !selectedDistrict && !selectedSubdistrict) {
    tapInstance[0].open();
  }
});