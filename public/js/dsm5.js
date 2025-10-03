// DSM-5 Functionality - PsiquiApp
// Manejo de categorías diagnósticas y búsquedas

class DSM5Manager {
    constructor() {
        this.currentCategory = '';
        this.searchResults = [];
        this.favorites = JSON.parse(localStorage.getItem('dsm5_favorites')) || [];
        this.initializeEventListeners();
        this.loadCategories();
    }

    initializeEventListeners() {
        // Búsqueda en tiempo real
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.performSearch(e.target.value);
            });
        }

        // Filtro por categoría
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterByCategory(e.target.value);
            });
        }

        // Event listeners para botones de categoría
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-btn')) {
                this.loadCategoryDetails(e.target.dataset.category);
            }
            
            if (e.target.classList.contains('disorder-btn')) {
                this.showDisorderDetails(e.target.dataset.disorder);
            }

            if (e.target.classList.contains('favorite-btn')) {
                this.toggleFavorite(e.target.dataset.disorder);
            }
        });
    }

    // Base de datos DSM-5 simplificada pero médicamente precisa
    getDSM5Database() {
        return {
            neurodevelopmental: {
                title: "Trastornos del Neurodesarrollo",
                icon: "fas fa-child",
                color: "primary",
                disorders: [
                    {
                        id: "adhd_combined",
                        code: "314.01 (F90.2)",
                        name: "Trastorno por Déficit de Atención/Hiperactividad, Presentación Combinada",
                        description: "Patrón persistente de inatención y/o hiperactividad-impulsividad que interfiere con el funcionamiento.",
                        criteria: [
                            "6 o más síntomas de inatención durante 6+ meses",
                            "6 o más síntomas de hiperactividad-impulsividad durante 6+ meses",
                            "Síntomas presentes antes de los 12 años",
                            "Deterioro en 2+ ambientes (casa, escuela, trabajo)",
                            "Deterioro clínicamente significativo"
                        ],
                        prevalence: "5% en niños, 2.5% en adultos",
                        treatment: "Terapia conductual, medicación estimulante, adaptaciones ambientales"
                    },
                    {
                        id: "autism_spectrum",
                        code: "299.00 (F84.0)",
                        name: "Trastorno del Espectro Autista",
                        description: "Déficits persistentes en comunicación e interacción social, patrones restrictivos de comportamiento.",
                        criteria: [
                            "Déficits en comunicación e interacción social",
                            "Patrones restrictivos y repetitivos de comportamiento",
                            "Síntomas presentes en período de desarrollo temprano",
                            "Deterioro clínicamente significativo",
                            "No explicado por discapacidad intelectual"
                        ],
                        prevalence: "1 en 44 niños (2.3%)",
                        treatment: "Intervención conductual temprana, terapia del habla, apoyo educativo especializado"
                    }
                ]
            },
            depressive: {
                title: "Trastornos Depresivos",
                icon: "fas fa-cloud-rain",
                color: "info",
                disorders: [
                    {
                        id: "major_depression",
                        code: "296.2x (F32.x)",
                        name: "Trastorno Depresivo Mayor",
                        description: "Episodio depresivo mayor caracterizado por estado de ánimo deprimido o pérdida de interés.",
                        criteria: [
                            "Estado de ánimo deprimido la mayor parte del día",
                            "Pérdida de interés o placer en actividades",
                            "Pérdida o aumento de peso significativo",
                            "Insomnio o hipersomnia",
                            "Agitación o retraso psicomotor",
                            "Fatiga o pérdida de energía",
                            "Sentimientos de inutilidad o culpa",
                            "Disminución de concentración",
                            "Pensamientos de muerte o suicidio"
                        ],
                        prevalence: "8.3% prevalencia anual",
                        treatment: "Antidepresivos, psicoterapia (TCC, TIP), cambios de estilo de vida"
                    },
                    {
                        id: "persistent_depressive",
                        code: "300.4 (F34.1)",
                        name: "Trastorno Depresivo Persistente (Distimia)",
                        description: "Estado de ánimo deprimido durante la mayor parte del día, más días que no, durante 2+ años.",
                        criteria: [
                            "Estado de ánimo deprimido 2+ años en adultos",
                            "1+ año en niños/adolescentes",
                            "2+ síntomas adicionales presentes",
                            "No asintomático >2 meses seguidos",
                            "Deterioro clínicamente significativo"
                        ],
                        prevalence: "0.5% prevalencia anual",
                        treatment: "Antidepresivos, psicoterapia de larga duración, manejo del estrés"
                    }
                ]
            },
            anxiety: {
                title: "Trastornos de Ansiedad",
                icon: "fas fa-heartbeat",
                color: "warning",
                disorders: [
                    {
                        id: "generalized_anxiety",
                        code: "300.02 (F41.1)",
                        name: "Trastorno de Ansiedad Generalizada",
                        description: "Ansiedad y preocupación excesivas sobre múltiples eventos o actividades.",
                        criteria: [
                            "Ansiedad y preocupación excesivas ≥6 meses",
                            "Dificultad para controlar la preocupación",
                            "3+ síntomas físicos (inquietud, fatiga, dificultad concentración, irritabilidad, tensión muscular, alteraciones del sueño)",
                            "Deterioro clínicamente significativo",
                            "No debido a sustancias o condición médica"
                        ],
                        prevalence: "2.9% prevalencia anual",
                        treatment: "TCC, medicación ansiolítica, técnicas de relajación"
                    },
                    {
                        id: "panic_disorder",
                        code: "300.01 (F41.0)",
                        name: "Trastorno de Pánico",
                        description: "Ataques de pánico recurrentes e inesperados seguidos de preocupación persistente.",
                        criteria: [
                            "Ataques de pánico recurrentes e inesperados",
                            "1+ mes de preocupación por ataques adicionales",
                            "Cambios desadaptativos en el comportamiento",
                            "No debido a sustancias o condición médica"
                        ],
                        prevalence: "2.7% prevalencia anual",
                        treatment: "TCC, exposición, ISRS, benzodiacepinas (corto plazo)"
                    }
                ]
            },
            bipolar: {
                title: "Trastornos Bipolares",
                icon: "fas fa-chart-line",
                color: "warning",
                disorders: [
                    {
                        id: "bipolar_i",
                        code: "296.4x (F31.x)",
                        name: "Trastorno Bipolar I",
                        description: "Al menos un episodio maníaco que puede estar precedido o seguido de episodios depresivos.",
                        criteria: [
                            "Al menos 1 episodio maníaco",
                            "Episodio maníaco: Estado de ánimo elevado/irritable ≥1 semana",
                            "3+ síntomas maniacos (autoestima elevada, disminución necesidad sueño, etc.)",
                            "Deterioro funcional severo o hospitalización",
                            "No debido a sustancias"
                        ],
                        prevalence: "0.6% prevalencia anual",
                        treatment: "Estabilizadores del ánimo (litio), antipsicóticos, psicoeducación"
                    },
                    {
                        id: "bipolar_ii",
                        code: "296.89 (F31.81)",
                        name: "Trastorno Bipolar II",
                        description: "Al menos un episodio hipomaníaco y un episodio depresivo mayor.",
                        criteria: [
                            "Al menos 1 episodio hipomaníaco",
                            "Al menos 1 episodio depresivo mayor",
                            "Nunca episodio maníaco completo",
                            "Deterioro clínicamente significativo",
                            "No explicado por otro trastorno"
                        ],
                        prevalence: "0.3% prevalencia anual",
                        treatment: "Estabilizadores del ánimo, antidepresivos (con precaución), psicoterapia"
                    }
                ]
            },
            schizophrenia: {
                title: "Espectro de la Esquizofrenia",
                icon: "fas fa-brain",
                color: "secondary",
                disorders: [
                    {
                        id: "schizophrenia",
                        code: "295.90 (F20.9)",
                        name: "Esquizofrenia",
                        description: "Trastorno psicótico con delirios, alucinaciones, discurso desorganizado y síntomas negativos.",
                        criteria: [
                            "2+ síntomas: delirios, alucinaciones, discurso desorganizado, comportamiento desorganizado, síntomas negativos",
                            "Al menos 1 debe ser delirios, alucinaciones o discurso desorganizado",
                            "Duración de 6+ meses con 1+ mes de síntomas activos",
                            "Deterioro funcional significativo",
                            "Exclusión de trastorno esquizoafectivo y del estado de ánimo"
                        ],
                        prevalence: "0.3%-0.7% prevalencia de por vida",
                        treatment: "Antipsicóticos, terapia cognitivo-conductual, apoyo psicosocial"
                    },
                    {
                        id: "schizoaffective",
                        code: "295.70 (F25.x)",
                        name: "Trastorno Esquizoafectivo",
                        description: "Período ininterrumpido con episodio del estado de ánimo y síntomas psicóticos de esquizofrenia.",
                        criteria: [
                            "Episodio del estado de ánimo mayor concurrente con criterio A de esquizofrenia",
                            "Delirios o alucinaciones 2+ semanas sin episodio del estado de ánimo",
                            "Síntomas del estado de ánimo presentes la mayor parte de la enfermedad",
                            "No atribuible a sustancias"
                        ],
                        prevalence: "0.3% prevalencia de por vida",
                        treatment: "Antipsicóticos, estabilizadores del ánimo, antidepresivos"
                    },
                    {
                        id: "delusional_disorder",
                        code: "297.1 (F22)",
                        name: "Trastorno Delirante",
                        description: "Presencia de delirios durante 1+ mes sin otros síntomas psicóticos prominentes.",
                        criteria: [
                            "1+ delirios durante 1+ mes",
                            "Criterio A para esquizofrenia nunca cumplido",
                            "Funcionamiento no marcadamente deteriorado",
                            "Episodios del estado de ánimo breves si presentes",
                            "No debido a sustancias o condición médica"
                        ],
                        prevalence: "0.02% prevalencia de por vida",
                        treatment: "Antipsicóticos, psicoterapia, manejo de comorbilidades"
                    }
                ]
            },
            ocd: {
                title: "Trastorno Obsesivo-Compulsivo",
                icon: "fas fa-sync",
                color: "dark",
                disorders: [
                    {
                        id: "ocd",
                        code: "300.3 (F42.2)",
                        name: "Trastorno Obsesivo-Compulsivo",
                        description: "Presencia de obsesiones, compulsiones o ambas que consumen tiempo y causan malestar.",
                        criteria: [
                            "Presencia de obsesiones, compulsiones o ambas",
                            "Obsesiones/compulsiones consumen tiempo (>1 hora/día)",
                            "Malestar clínicamente significativo o deterioro",
                            "No atribuible a sustancias o condición médica",
                            "No explicado mejor por otro trastorno mental"
                        ],
                        prevalence: "1.2% prevalencia anual",
                        treatment: "TCC con exposición y prevención de respuesta, ISRS, clomipramina"
                    },
                    {
                        id: "body_dysmorphic",
                        code: "300.7 (F45.22)",
                        name: "Trastorno Dismórfico Corporal",
                        description: "Preocupación por defectos percibidos en la apariencia física no observables por otros.",
                        criteria: [
                            "Preocupación por defectos percibidos en apariencia",
                            "Comportamientos repetitivos en respuesta",
                            "Preocupación causa malestar significativo",
                            "No explicado mejor por trastorno alimentario"
                        ],
                        prevalence: "2.4% prevalencia de por vida",
                        treatment: "TCC, ISRS, manejo de rituales"
                    },
                    {
                        id: "hoarding",
                        code: "300.3 (F42.3)",
                        name: "Trastorno de Acumulación",
                        description: "Dificultad persistente para desechar posesiones independientemente de su valor real.",
                        criteria: [
                            "Dificultad persistente para desechar posesiones",
                            "Dificultad debido a necesidad percibida de guardar items",
                            "Acumulación de posesiones que congestionan áreas de vivienda",
                            "Malestar clínicamente significativo o deterioro",
                            "No atribuible a condición médica"
                        ],
                        prevalence: "2%-6% prevalencia",
                        treatment: "TCC especializada, organización asistida, medicación"
                    }
                ]
            },
            trauma: {
                title: "Trastornos Relacionados con Traumas",
                icon: "fas fa-shield-alt",
                color: "warning",
                disorders: [
                    {
                        id: "ptsd",
                        code: "309.81 (F43.10)",
                        name: "Trastorno de Estrés Postraumático (TEPT)",
                        description: "Síntomas persistentes tras exposición a evento traumático con amenaza de muerte o lesión.",
                        criteria: [
                            "Exposición a evento traumático",
                            "1+ síntomas de intrusión",
                            "1+ síntomas de evitación",
                            "2+ alteraciones negativas en cognición y estado de ánimo",
                            "2+ alteraciones en excitación y reactividad",
                            "Duración >1 mes",
                            "Malestar o deterioro significativo"
                        ],
                        prevalence: "3.5% prevalencia anual",
                        treatment: "TCC centrada en trauma, EMDR, medicación (ISRS)"
                    },
                    {
                        id: "acute_stress",
                        code: "308.3 (F43.0)",
                        name: "Trastorno de Estrés Agudo",
                        description: "Síntomas similares a TEPT que ocurren 3 días a 1 mes tras evento traumático.",
                        criteria: [
                            "Exposición a evento traumático",
                            "9+ síntomas de intrusión, estado de ánimo negativo, disociación, evitación, excitación",
                            "Duración de 3 días a 1 mes",
                            "Malestar o deterioro significativo",
                            "No atribuible a sustancias"
                        ],
                        prevalence: "Variable según trauma",
                        treatment: "Intervención temprana, TCC, apoyo psicosocial"
                    },
                    {
                        id: "reactive_attachment",
                        code: "313.89 (F94.1)",
                        name: "Trastorno de Apego Reactivo",
                        description: "Patrón de conducta inhibida hacia cuidadores adultos en niños.",
                        criteria: [
                            "Patrón de conducta inhibida y emocionalmente retraída",
                            "Alteración social y emocional persistente",
                            "Patrón de cuidado insuficiente extremo",
                            "Cuidado patógeno presumiblemente responsable",
                            "Edad de desarrollo ≥9 meses"
                        ],
                        prevalence: "Raro, prevalencia desconocida",
                        treatment: "Terapia familiar, cuidado estable, intervención temprana"
                    }
                ]
            },
            personality: {
                title: "Trastornos de la Personalidad",
                icon: "fas fa-user-friends",
                color: "success",
                disorders: [
                    {
                        id: "borderline",
                        code: "301.83 (F60.3)",
                        name: "Trastorno Límite de la Personalidad",
                        description: "Patrón de inestabilidad en relaciones interpersonales, autoimagen y afectos, e impulsividad marcada.",
                        criteria: [
                            "Esfuerzos frenéticos para evitar abandono",
                            "Patrón de relaciones inestables e intensas",
                            "Alteración de la identidad",
                            "Impulsividad en 2+ áreas potencialmente dañinas",
                            "Comportamiento, intentos o amenazas suicidas",
                            "Inestabilidad afectiva",
                            "Sentimientos crónicos de vacío",
                            "Ira intensa inapropiada",
                            "Ideación paranoide transitoria o síntomas disociativos"
                        ],
                        prevalence: "1.6% prevalencia de por vida",
                        treatment: "Terapia dialéctica conductual, mentalización, esquemas"
                    },
                    {
                        id: "antisocial",
                        code: "301.7 (F60.2)",
                        name: "Trastorno Antisocial de la Personalidad",
                        description: "Patrón de desprecio y violación de derechos de otros desde los 15 años.",
                        criteria: [
                            "Fracaso para conformarse a normas legales",
                            "Engaño (mentiras repetidas, uso de alias)",
                            "Impulsividad o fracaso para planificar",
                            "Irritabilidad y agresividad",
                            "Temeridad hacia seguridad propia o de otros",
                            "Irresponsabilidad consistente",
                            "Ausencia de remordimiento",
                            "Al menos 18 años",
                            "Evidencia de trastorno de conducta antes de los 15 años"
                        ],
                        prevalence: "0.2%-3.3% prevalencia",
                        treatment: "Psicoterapia, manejo de comorbilidades, tratamiento comunitario"
                    },
                    {
                        id: "narcissistic",
                        code: "301.81 (F60.81)",
                        name: "Trastorno Narcisista de la Personalidad",
                        description: "Patrón de grandiosidad, necesidad de admiración y falta de empatía.",
                        criteria: [
                            "Sentido grandioso de autoimportancia",
                            "Preocupación por fantasías de éxito ilimitado",
                            "Creencia de ser especial y único",
                            "Necesidad de admiración excesiva",
                            "Sentido de privilegio",
                            "Explotador interpersonalmente",
                            "Carece de empatía",
                            "Envidioso de otros",
                            "Comportamientos o actitudes arrogantes"
                        ],
                        prevalence: "0%-6.2% prevalencia",
                        treatment: "Psicoterapia psicodinámica, terapia centrada en esquemas"
                    },
                    {
                        id: "avoidant",
                        code: "301.82 (F60.6)",
                        name: "Trastorno de la Personalidad por Evitación",
                        description: "Patrón de inhibición social, sentimientos de inadecuación e hipersensibilidad.",
                        criteria: [
                            "Evita actividades ocupacionales con contacto interpersonal",
                            "Reacio a involucrarse con personas",
                            "Restricción en relaciones íntimas por temor a vergüenza",
                            "Preocupado por críticas o rechazo",
                            "Inhibido en situaciones interpersonales nuevas",
                            "Se ve socialmente inepto",
                            "Reacio a tomar riesgos personales"
                        ],
                        prevalence: "2.4% prevalencia",
                        treatment: "TCC, terapia grupal, exposición gradual"
                    }
                ]
            }
        };
    }

    // Obtener conteos reales de trastornos por categoría desde getDSM5Database()
    getCategoryCount(categoryKey) {
        const database = this.getDSM5Database();
        return database[categoryKey] ? database[categoryKey].disorders.length : 0;
    }

    loadCategories() {
        const database = this.getDSM5Database();
        const categoriesContainer = document.getElementById('categoriesContainer');
        
        if (!categoriesContainer) return;
        
        // Limpiar input de búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Limpiar resultados anteriores y mostrar categorías
        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
        }
        categoriesContainer.style.display = 'flex';

        categoriesContainer.innerHTML = Object.keys(database).map(categoryKey => {
            const category = database[categoryKey];
            const realCount = this.getCategoryCount(categoryKey);
            return `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 category-card border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="category-icon mb-3">
                                <i class="${category.icon} text-${category.color}" style="font-size: 3rem;"></i>
                            </div>
                            <h5 class="card-title text-${category.color}">${category.title}</h5>
                            <p class="card-text text-muted small">
                                ${realCount} ${realCount === 1 ? 'trastorno disponible' : 'trastornos disponibles'}
                            </p>
                            <button class="btn btn-outline-${category.color} category-btn" 
                                    data-category="${categoryKey}">
                                <i class="fas fa-eye me-1"></i>
                                Ver Detalles
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    loadCategoryDetails(categoryKey) {
        const database = this.getDSM5Database();
        const category = database[categoryKey];
        
        if (!category) return;

        const resultsContainer = document.getElementById('resultsContainer');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h4 class="text-${category.color}">
                            <i class="${category.icon} me-2"></i>
                            ${category.title}
                        </h4>
                        <button class="btn btn-outline-secondary" onclick="dsm5Manager.loadCategories()">
                            <i class="fas fa-arrow-left me-1"></i>
                            Volver a Categorías
                        </button>
                    </div>
                </div>
            </div>
            <div class="row">
                ${category.disorders.map(disorder => `
                    <div class="col-12 mb-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div class="flex-grow-1">
                                        <h6 class="card-title text-${category.color} mb-1">
                                            ${disorder.code}
                                        </h6>
                                        <h5 class="mb-2">${disorder.name}</h5>
                                        <p class="card-text text-muted mb-3">${disorder.description}</p>
                                        <div class="d-flex gap-2">
                                            <button class="btn btn-${category.color} btn-sm disorder-btn" 
                                                    data-disorder="${disorder.id}">
                                                <i class="fas fa-info-circle me-1"></i>
                                                Ver Criterios
                                            </button>
                                            <button class="btn btn-outline-warning btn-sm favorite-btn ${this.favorites.includes(disorder.id) ? 'active' : ''}" 
                                                    data-disorder="${disorder.id}">
                                                <i class="fas fa-star me-1"></i>
                                                ${this.favorites.includes(disorder.id) ? 'Guardado' : 'Guardar'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    showDisorderDetails(disorderId) {
        const database = this.getDSM5Database();
        let disorder = null;
        let categoryKey = null;

        // Buscar el trastorno en todas las categorías
        for (const [key, category] of Object.entries(database)) {
            const found = category.disorders.find(d => d.id === disorderId);
            if (found) {
                disorder = found;
                categoryKey = key;
                break;
            }
        }

        if (!disorder) return;

        const modalBody = document.getElementById('disorderModalBody');
        const modalTitle = document.getElementById('disorderModalTitle');
        
        if (modalTitle) {
            modalTitle.innerHTML = `
                <i class="${database[categoryKey].icon} me-2"></i>
                ${disorder.name}
            `;
        }

        if (modalBody) {
            modalBody.innerHTML = `
                <div class="mb-4">
                    <h6 class="text-primary">Código DSM-5</h6>
                    <p class="fw-bold">${disorder.code}</p>
                </div>

                <div class="mb-4">
                    <h6 class="text-primary">Descripción</h6>
                    <p>${disorder.description}</p>
                </div>

                <div class="mb-4">
                    <h6 class="text-primary">Criterios Diagnósticos</h6>
                    <ul class="list-group list-group-flush">
                        ${disorder.criteria.map(criterion => `
                            <li class="list-group-item border-0 px-0">
                                <i class="fas fa-check-circle text-success me-2"></i>
                                ${criterion}
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <div class="mb-4">
                    <h6 class="text-primary">Prevalencia</h6>
                    <p><i class="fas fa-chart-bar me-2"></i>${disorder.prevalence}</p>
                </div>

                <div class="mb-4">
                    <h6 class="text-primary">Tratamiento</h6>
                    <p><i class="fas fa-pills me-2"></i>${disorder.treatment}</p>
                </div>

                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Nota:</strong> Esta información es solo para referencia profesional. 
                    El diagnóstico debe realizarse por un profesional de salud mental calificado.
                </div>
            `;
        }

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('disorderModal'));
        modal.show();
    }

    performSearch(query) {
        const resultsContainer = document.getElementById('resultsContainer');
        const categoriesContainer = document.getElementById('categoriesContainer');
        
        // Si la búsqueda está vacía o es muy corta, limpiar resultados y mostrar categorías
        if (query.length < 2) {
            if (resultsContainer) {
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
            }
            if (categoriesContainer) {
                categoriesContainer.style.display = 'flex';
            }
            return;
        }

        const database = this.getDSM5Database();
        const results = [];

        Object.keys(database).forEach(categoryKey => {
            const category = database[categoryKey];
            category.disorders.forEach(disorder => {
                if (
                    disorder.name.toLowerCase().includes(query.toLowerCase()) ||
                    disorder.code.toLowerCase().includes(query.toLowerCase()) ||
                    disorder.description.toLowerCase().includes(query.toLowerCase())
                ) {
                    results.push({
                        ...disorder,
                        category: category,
                        categoryKey: categoryKey
                    });
                }
            });
        });

        this.displaySearchResults(results, query);
    }

    displaySearchResults(results, query) {
        let resultsContainer = document.getElementById('resultsContainer');
        const categoriesContainer = document.getElementById('categoriesContainer');
        
        if (!categoriesContainer) return;
        
        // Crear contenedor de resultados si no existe
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'resultsContainer';
            resultsContainer.className = 'row mb-4';
            categoriesContainer.parentNode.insertBefore(resultsContainer, categoriesContainer);
        }
        
        // Asegurar visibilidad del contenedor de resultados
        resultsContainer.style.display = 'flex';
        categoriesContainer.style.display = 'none';

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning border-0 shadow-sm" role="alert" id="searchErrorAlert">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-exclamation-triangle fa-2x text-warning me-3"></i>
                            <div>
                                <h5 class="alert-heading mb-1">
                                    <i class="fas fa-search me-2"></i>
                                    Código o Diagnóstico No Encontrado
                                </h5>
                                <p class="mb-0">No se encontraron trastornos que coincidan con: <strong>"${query}"</strong></p>
                            </div>
                        </div>
                        <hr>
                        <div class="mb-0">
                            <p class="mb-2"><strong>Sugerencias:</strong></p>
                            <ul class="mb-3">
                                <li>Verifique que el código DSM-5 esté escrito correctamente</li>
                                <li>Intente con palabras clave diferentes o más generales</li>
                                <li>Use términos médicos o nombres comunes del trastorno</li>
                                <li>Explore las categorías para encontrar diagnósticos similares</li>
                            </ul>
                            <button class="btn btn-primary" onclick="dsm5Manager.loadCategories()">
                                <i class="fas fa-th-large me-2"></i>
                                Ver Todas las Categorías
                            </button>
                            <button class="btn btn-outline-secondary ms-2" onclick="document.getElementById('searchInput').value=''; dsm5Manager.loadCategories()">
                                <i class="fas fa-times me-2"></i>
                                Limpiar Búsqueda
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Forzar reflow y hacer scroll suave hacia el mensaje de error
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const errorAlert = document.getElementById('searchErrorAlert');
                    if (errorAlert) {
                        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
            });
            return;
        }

        resultsContainer.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h4 class="text-primary">
                            <i class="fas fa-search me-2"></i>
                            Resultados para "${query}" (${results.length})
                        </h4>
                        <button class="btn btn-outline-secondary" onclick="dsm5Manager.loadCategories()">
                            <i class="fas fa-times me-1"></i>
                            Limpiar Búsqueda
                        </button>
                    </div>
                </div>
            </div>
            <div class="row">
                ${results.map(disorder => `
                    <div class="col-12 mb-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div class="flex-grow-1">
                                        <div class="d-flex align-items-center mb-2">
                                            <span class="badge bg-${disorder.category.color} me-2">
                                                <i class="${disorder.category.icon} me-1"></i>
                                                ${disorder.category.title}
                                            </span>
                                            <small class="text-muted">${disorder.code}</small>
                                        </div>
                                        <h5 class="mb-2">${disorder.name}</h5>
                                        <p class="card-text text-muted mb-3">${disorder.description}</p>
                                        <div class="d-flex gap-2">
                                            <button class="btn btn-${disorder.category.color} btn-sm disorder-btn" 
                                                    data-disorder="${disorder.id}">
                                                <i class="fas fa-info-circle me-1"></i>
                                                Ver Criterios
                                            </button>
                                            <button class="btn btn-outline-warning btn-sm favorite-btn ${this.favorites.includes(disorder.id) ? 'active' : ''}" 
                                                    data-disorder="${disorder.id}">
                                                <i class="fas fa-star me-1"></i>
                                                ${this.favorites.includes(disorder.id) ? 'Guardado' : 'Guardar'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    filterByCategory(categoryKey) {
        if (!categoryKey) {
            this.loadCategories();
            return;
        }
        this.loadCategoryDetails(categoryKey);
    }

    toggleFavorite(disorderId) {
        const index = this.favorites.indexOf(disorderId);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(disorderId);
        }
        
        localStorage.setItem('dsm5_favorites', JSON.stringify(this.favorites));
        
        // Actualizar botón
        const button = document.querySelector(`[data-disorder="${disorderId}"].favorite-btn`);
        if (button) {
            if (this.favorites.includes(disorderId)) {
                button.classList.add('active');
                button.innerHTML = '<i class="fas fa-star me-1"></i>Guardado';
            } else {
                button.classList.remove('active');
                button.innerHTML = '<i class="fas fa-star me-1"></i>Guardar';
            }
        }
    }

    showFavorites() {
        if (this.favorites.length === 0) {
            // Mostrar mensaje de no favoritos
            const resultsContainer = document.getElementById('resultsContainer');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="col-12">
                        <div class="text-center py-5">
                            <i class="fas fa-star text-muted" style="font-size: 3rem;"></i>
                            <h5 class="mt-3 text-muted">No tienes favoritos guardados</h5>
                            <p class="text-muted">Guarda trastornos para acceso rápido</p>
                            <button class="btn btn-primary" onclick="dsm5Manager.loadCategories()">
                                Explorar Categorías
                            </button>
                        </div>
                    </div>
                `;
            }
            return;
        }

        // Buscar todos los trastornos favoritos
        const database = this.getDSM5Database();
        const favoriteDisorders = [];

        Object.keys(database).forEach(categoryKey => {
            const category = database[categoryKey];
            category.disorders.forEach(disorder => {
                if (this.favorites.includes(disorder.id)) {
                    favoriteDisorders.push({
                        ...disorder,
                        category: category,
                        categoryKey: categoryKey
                    });
                }
            });
        });

        this.displaySearchResults(favoriteDisorders, 'Favoritos');
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    window.dsm5Manager = new DSM5Manager();
});

// Función global para mostrar favoritos (llamada desde el modal)
function showFavorites() {
    if (window.dsm5Manager) {
        window.dsm5Manager.showFavorites();
    }
}

// Función global para mostrar categoría específica
function showCategory(categoryKey) {
    // Base de datos de categorías DSM-5
    const categoryData = {
        'neurodevelopmental': {
            title: 'Trastornos del Neurodesarrollo',
            description: 'Trastornos del desarrollo intelectual, comunicación, autismo, TDAH y específicos del aprendizaje',
            disorders: [
                { code: '315.00', name: 'Discapacidad intelectual leve', criteria: 'CI entre 50-55 y 70, déficits adaptativos' },
                { code: '315.1', name: 'Discapacidad intelectual moderada', criteria: 'CI entre 35-40 y 50-55' },
                { code: '315.2', name: 'Discapacidad intelectual grave', criteria: 'CI entre 20-25 y 35-40' },
                { code: '299.00', name: 'Trastorno del espectro autista', criteria: 'Déficits sociales, patrones repetitivos' },
                { code: '314.01', name: 'TDAH combinado', criteria: 'Síntomas de inatención e hiperactividad' },
                { code: '314.00', name: 'TDAH predominio inatento', criteria: 'Predominio síntomas de inatención' },
                { code: '314.01', name: 'TDAH predominio hiperactivo', criteria: 'Predominio síntomas de hiperactividad' },
                { code: '315.39', name: 'Trastorno del lenguaje', criteria: 'Déficits en adquisición y uso del lenguaje' },
                { code: '315.35', name: 'Trastorno fonológico', criteria: 'Falta de uso de sonidos del habla' }
            ]
        },
        'schizophrenia': {
            title: 'Espectro de la Esquizofrenia y Otros Trastornos Psicóticos',
            description: 'Delirios, alucinaciones, pensamiento desorganizado, comportamiento motor anormal y síntomas negativos',
            disorders: [
                { code: '295.90', name: 'Esquizofrenia', criteria: 'Delirios, alucinaciones, lenguaje desorganizado (6+ meses)' },
                { code: '295.40', name: 'Trastorno esquizofreniforme', criteria: 'Síntomas de esquizofrenia durante 1-6 meses' },
                { code: '298.8', name: 'Trastorno psicótico breve', criteria: 'Síntomas psicóticos durante al menos 1 día, menos de 1 mes' },
                { code: '295.70', name: 'Trastorno esquizoafectivo', criteria: 'Esquizofrenia + episodios afectivos mayores' },
                { code: '297.1', name: 'Trastorno delirante', criteria: 'Delirios 1+ mes, funcionamiento no deteriorado' },
                { code: '292.9', name: 'Trastorno psicótico inducido por sustancias', criteria: 'Síntomas psicóticos por intoxicación/abstinencia' },
                { code: '293.81', name: 'Trastorno psicótico debido a condición médica', criteria: 'Consecuencia de efectos fisiológicos de condición médica' }
            ]
        },
        'bipolar': {
            title: 'Trastorno Bipolar y Trastornos Relacionados',
            description: 'Episodios maníacos, hipomaníacos y depresivos',
            disorders: [
                { code: '296.41', name: 'Trastorno bipolar I, episodio maníaco actual', criteria: 'Al menos 1 episodio maníaco' },
                { code: '296.40', name: 'Trastorno bipolar I, episodio hipomaníaco actual', criteria: 'Episodio maníaco previo + hipomaníaco actual' },
                { code: '296.51', name: 'Trastorno bipolar I, episodio depresivo actual', criteria: 'Episodio maníaco previo + depresivo actual' },
                { code: '296.89', name: 'Trastorno bipolar II', criteria: 'Al menos 1 episodio hipomaníaco + 1 episodio depresivo mayor' },
                { code: '301.13', name: 'Trastorno ciclotímico', criteria: 'Síntomas hipomaníacos y depresivos 2+ años' },
                { code: '293.83', name: 'Trastorno bipolar inducido por sustancias', criteria: 'Síntomas por intoxicación/abstinencia' },
                { code: '293.83', name: 'Trastorno bipolar debido a condición médica', criteria: 'Consecuencia de efectos fisiológicos' }
            ]
        },
        'depressive': {
            title: 'Trastornos Depresivos',
            description: 'Episodios de depresión mayor, distimia y trastornos relacionados',
            disorders: [
                { code: '296.21', name: 'Trastorno depresivo mayor, episodio único', criteria: '5+ síntomas 2+ semanas, primer episodio' },
                { code: '296.31', name: 'Trastorno depresivo mayor, recurrente', criteria: '5+ síntomas 2+ semanas, episodios múltiples' },
                { code: '300.4', name: 'Trastorno depresivo persistente (distimia)', criteria: 'Estado de ánimo deprimido 2+ años' },
                { code: '625.4', name: 'Trastorno disfórico premenstrual', criteria: 'Síntomas en semana premenstrual' },
                { code: '292.84', name: 'Trastorno depresivo inducido por sustancias', criteria: 'Síntomas por intoxicación/abstinencia' },
                { code: '293.83', name: 'Trastorno depresivo debido a condición médica', criteria: 'Consecuencia de efectos fisiológicos' },
                { code: '311', name: 'Otro trastorno depresivo especificado', criteria: 'Síntomas depresivos que no cumplen criterios completos' }
            ]
        },
        'anxiety': {
            title: 'Trastornos de Ansiedad',
            description: 'Ansiedad excesiva, miedo y trastornos del comportamiento relacionados',
            disorders: [
                { code: '309.21', name: 'Trastorno de ansiedad por separación', criteria: 'Ansiedad excesiva ante separación de figuras de apego' },
                { code: '312.23', name: 'Mutismo selectivo', criteria: 'Falta constante de habla en situaciones sociales específicas' },
                { code: '300.29', name: 'Fobia específica', criteria: 'Miedo o ansiedad marcados ante objeto/situación específica' },
                { code: '300.23', name: 'Trastorno de ansiedad social', criteria: 'Miedo/ansiedad en situaciones sociales' },
                { code: '300.01', name: 'Trastorno de pánico', criteria: 'Ataques de pánico recurrentes inesperados' },
                { code: '300.22', name: 'Agorafobia', criteria: 'Miedo/ansiedad en 2+ situaciones agorafóbicas' },
                { code: '300.02', name: 'Trastorno de ansiedad generalizada', criteria: 'Ansiedad/preocupación excesiva 6+ meses' },
                { code: '292.89', name: 'Trastorno de ansiedad inducido por sustancias', criteria: 'Síntomas por intoxicación/abstinencia' },
                { code: '293.84', name: 'Trastorno de ansiedad debido a condición médica', criteria: 'Consecuencia de efectos fisiológicos' }
            ]
        },
        'personality': {
            title: 'Trastornos de la Personalidad',
            description: 'Patrones duraderos de experiencia interna y comportamiento',
            disorders: [
                { code: '301.0', name: 'Trastorno paranoide de la personalidad', criteria: 'Desconfianza y suspicacia generalizadas' },
                { code: '301.20', name: 'Trastorno esquizoide de la personalidad', criteria: 'Desapego de relaciones sociales, rango emocional restringido' },
                { code: '301.22', name: 'Trastorno esquizotípico de la personalidad', criteria: 'Déficits sociales/interpersonales, distorsiones cognitivas' },
                { code: '301.7', name: 'Trastorno antisocial de la personalidad', criteria: 'Desprecio y violación de derechos de otros' },
                { code: '301.83', name: 'Trastorno límite de la personalidad', criteria: 'Inestabilidad en relaciones, autoimagen y afectos' },
                { code: '301.50', name: 'Trastorno histriónico de la personalidad', criteria: 'Emotividad excesiva y búsqueda de atención' },
                { code: '301.81', name: 'Trastorno narcisista de la personalidad', criteria: 'Grandiosidad, necesidad de admiración, falta de empatía' },
                { code: '301.82', name: 'Trastorno de la personalidad por evitación', criteria: 'Inhibición social, sentimientos de inadecuación' },
                { code: '301.6', name: 'Trastorno dependiente de la personalidad', criteria: 'Necesidad excesiva de que se ocupen de uno' },
                { code: '301.4', name: 'Trastorno obsesivo-compulsivo de la personalidad', criteria: 'Preocupación por orden, perfeccionismo y control' }
            ]
        }
    };

    const category = categoryData[categoryKey];
    if (!category) {
        alert('Información no disponible para esta categoría');
        return;
    }

    // Crear modal para mostrar la información
    const modalId = 'categoryModal';
    let modal = document.getElementById(modalId);
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal fade';
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="categoryModalTitle"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="categoryModalBody">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="exportCategory('${categoryKey}')">
                            <i class="fas fa-download me-1"></i>
                            Exportar
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Actualizar contenido del modal
    document.getElementById('categoryModalTitle').textContent = category.title;
    
    const modalBody = document.getElementById('categoryModalBody');
    modalBody.innerHTML = `
        <div class="mb-4">
            <p class="lead">${category.description}</p>
            <hr>
        </div>
        
        <div class="row">
            <div class="col-12">
                <h6 class="mb-3">Trastornos disponibles (${category.disorders.length} trastornos):</h6>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-light">
                            <tr>
                                <th style="width: 15%;">Código</th>
                                <th style="width: 40%;">Trastorno</th>
                                <th style="width: 35%;">Criterios Principales</th>
                                <th style="width: 10%;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${category.disorders.map(disorder => `
                                <tr style="cursor: pointer;" onclick="showDisorderDetails('${disorder.code}', '${disorder.name.replace(/'/g, "\\'")}', '${categoryKey}')" class="disorder-row">
                                    <td><strong class="text-primary">${disorder.code}</strong></td>
                                    <td><strong>${disorder.name}</strong></td>
                                    <td><small class="text-muted">${disorder.criteria}</small></td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary me-1" onclick="event.stopPropagation(); copyDSMCode('${disorder.code}')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-success" onclick="event.stopPropagation(); addDSMToFavorites('${disorder.code}', '${disorder.name.replace(/'/g, "\\'")}')">
                                            <i class="fas fa-star"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-info" onclick="event.stopPropagation(); showDisorderDetails('${disorder.code}', '${disorder.name.replace(/'/g, "\\'")}', '${categoryKey}')">
                                            <i class="fas fa-info-circle"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <div class="alert alert-warning mt-4">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Importante:</strong> Esta información es de referencia educativa. El diagnóstico debe basarse en una evaluación clínica completa y el DSM-5 oficial.
            <br><small class="text-muted mt-2 d-block">
                <i class="fas fa-mouse-pointer me-1"></i>
                Haga clic en cualquier fila para ver criterios diagnósticos detallados
            </small>
        </div>
        
        <style>
            .disorder-row:hover {
                background-color: #f8f9fa !important;
                transform: translateY(-1px);
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .disorder-row {
                transition: all 0.2s ease;
            }
        </style>
    `;

    // Mostrar modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

// Función para copiar código DSM al portapapeles
function copyDSMCode(code) {
    navigator.clipboard.writeText(code).then(function() {
        // Mostrar notificación de éxito
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle me-2"></i>
                Código ${code} copiado al portapapeles
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';
        document.body.appendChild(toast);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    });
}

// Función para agregar a favoritos DSM
function addDSMToFavorites(code, name) {
    const favorites = JSON.parse(localStorage.getItem('dsm5_favorites')) || [];
    const favorite = { code, name, date: new Date().toISOString() };
    
    // Verificar si ya existe
    if (!favorites.find(fav => fav.code === code)) {
        favorites.push(favorite);
        localStorage.setItem('dsm5_favorites', JSON.stringify(favorites));
        
        // Mostrar notificación de éxito
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-star me-2"></i>
                ${code} agregado a favoritos
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    } else {
        alert('Este trastorno ya está en tus favoritos');
    }
}

// Función para exportar categoría
function exportCategory(categoryKey) {
    const dsm5Manager = window.dsm5Manager || new DSM5Manager();
    const database = dsm5Manager.getDSM5Database();
    const category = database[categoryKey];
    
    if (!category) {
        showNotification('Categoría no encontrada', 'error');
        return;
    }
    
    // Crear contenido de exportación
    let exportContent = `DSM-5 - ${category.title}\n`;
    exportContent += `${'='.repeat(50)}\n\n`;
    exportContent += `Total de trastornos: ${category.disorders.length}\n\n`;
    
    category.disorders.forEach((disorder, index) => {
        exportContent += `${index + 1}. ${disorder.name}\n`;
        exportContent += `   Código: ${disorder.code}\n`;
        exportContent += `   Descripción: ${disorder.description}\n`;
        exportContent += `   Prevalencia: ${disorder.prevalence}\n`;
        exportContent += `   Tratamiento: ${disorder.treatment}\n`;
        exportContent += `   \n   Criterios Diagnósticos:\n`;
        disorder.criteria.forEach((criterion, i) => {
            exportContent += `   ${i + 1}) ${criterion}\n`;
        });
        exportContent += `\n${'='.repeat(50)}\n\n`;
    });
    
    exportContent += `\n\nNota: Esta información es de referencia profesional.\n`;
    exportContent += `El diagnóstico debe realizarse por un profesional de salud mental calificado.\n`;
    exportContent += `Fuente: DSM-5 (Manual Diagnóstico y Estadístico de los Trastornos Mentales, 5ª edición)\n`;
    
    // Crear blob y descargar
    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DSM5_${categoryKey}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`Categoría "${category.title}" exportada exitosamente`, 'success');
}

// Funciones adicionales para otros botones
function openCodeSearch() {
    const dsm5Manager = window.dsm5Manager || new DSM5Manager();
    const database = dsm5Manager.getDSM5Database();
    
    // Obtener todos los trastornos
    let allDisorders = [];
    Object.keys(database).forEach(categoryKey => {
        const category = database[categoryKey];
        category.disorders.forEach(disorder => {
            allDisorders.push({
                ...disorder,
                categoryKey,
                categoryTitle: category.title,
                categoryIcon: category.icon,
                categoryColor: category.color
            });
        });
    });
    
    // Crear modal de búsqueda
    const modalHtml = `
        <div class="modal fade" id="codeSearchModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-search me-2"></i>
                            Búsqueda por Código DSM-5
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <input type="text" class="form-control form-control-lg" 
                                   id="codeSearchInput" 
                                   placeholder="Buscar por código (ej: 296, F31, 300.01) o nombre del trastorno...">
                        </div>
                        <div id="codeSearchResults" class="mt-3">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th style="width: 15%;">Código</th>
                                            <th style="width: 35%;">Trastorno</th>
                                            <th style="width: 30%;">Categoría</th>
                                            <th style="width: 20%;">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="codeSearchTableBody">
                                        ${allDisorders.map(disorder => `
                                            <tr class="searchable-disorder" data-code="${disorder.code}" data-name="${disorder.name}">
                                                <td><strong class="text-primary">${disorder.code}</strong></td>
                                                <td>${disorder.name}</td>
                                                <td>
                                                    <i class="${disorder.categoryIcon} text-${disorder.categoryColor} me-1"></i>
                                                    <small>${disorder.categoryTitle}</small>
                                                </td>
                                                <td>
                                                    <button class="btn btn-sm btn-outline-primary me-1" 
                                                            onclick="copyDSMCode('${disorder.code}')">
                                                        <i class="fas fa-copy"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-info" 
                                                            onclick="showDisorderDetails('${disorder.code}', '${disorder.name.replace(/'/g, "\\")}', '${disorder.categoryKey}'); bootstrap.Modal.getInstance(document.getElementById('codeSearchModal')).hide();">
                                                        <i class="fas fa-info-circle"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal" style="height: 38px; border-radius: 4px;">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const existingModal = document.getElementById('codeSearchModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Configurar búsqueda en tiempo real
    const searchInput = document.getElementById('codeSearchInput');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('.searchable-disorder');
        
        rows.forEach(row => {
            const code = row.dataset.code.toLowerCase();
            const name = row.dataset.name.toLowerCase();
            
            if (code.includes(searchTerm) || name.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('codeSearchModal'));
    modal.show();
    
    // Focus en input
    setTimeout(() => searchInput.focus(), 300);
}

function openCriteria() {
    const dsm5Manager = window.dsm5Manager || new DSM5Manager();
    const database = dsm5Manager.getDSM5Database();
    
    // Crear modal de criterios
    const modalHtml = `
        <div class="modal fade" id="criteriaModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-clipboard-check me-2"></i>
                            Criterios Diagnósticos DSM-5
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label fw-bold">Categoría:</label>
                                <select class="form-select" id="criteriaCategory">
                                    <option value="">Seleccione una categoría</option>
                                    ${Object.keys(database).map(key => `
                                        <option value="${key}">${database[key].title}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-bold">Trastorno:</label>
                                <select class="form-select" id="criteriaDisorder" disabled>
                                    <option value="">Primero seleccione una categoría</option>
                                </select>
                            </div>
                        </div>
                        <div id="criteriaDisplay" class="mt-4">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                Seleccione una categoría y un trastorno para ver los criterios diagnósticos detallados.
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal" style="height: 38px; border-radius: 4px;">Cerrar</button>
                        <button type="button" class="btn btn-primary px-4" id="printCriteria" style="height: 38px; border-radius: 4px;" disabled>
                            <i class="fas fa-print me-1"></i>Imprimir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const existingModal = document.getElementById('criteriaModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Event listeners
    const categorySelect = document.getElementById('criteriaCategory');
    const disorderSelect = document.getElementById('criteriaDisorder');
    const criteriaDisplay = document.getElementById('criteriaDisplay');
    const printBtn = document.getElementById('printCriteria');
    
    categorySelect.addEventListener('change', function() {
        const categoryKey = this.value;
        if (!categoryKey) {
            disorderSelect.disabled = true;
            disorderSelect.innerHTML = '<option value="">Primero seleccione una categoría</option>';
            return;
        }
        
        const category = database[categoryKey];
        disorderSelect.disabled = false;
        disorderSelect.innerHTML = '<option value="">Seleccione un trastorno</option>' + 
            category.disorders.map((d, i) => `<option value="${i}">${d.name}</option>`).join('');
    });
    
    disorderSelect.addEventListener('change', function() {
        const categoryKey = categorySelect.value;
        const disorderIndex = this.value;
        
        if (!categoryKey || disorderIndex === '') {
            criteriaDisplay.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>Seleccione un trastorno</div>';
            printBtn.disabled = true;
            return;
        }
        
        const category = database[categoryKey];
        const disorder = category.disorders[disorderIndex];
        
        criteriaDisplay.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title text-${category.color}">
                        <i class="${category.icon} me-2"></i>
                        ${disorder.name}
                    </h5>
                    <p class="text-muted mb-3"><strong>Código:</strong> ${disorder.code}</p>
                    <p class="mb-4">${disorder.description}</p>
                    
                    <h6 class="text-primary mb-3">Criterios Diagnósticos:</h6>
                    <ol class="list-group list-group-numbered">
                        ${disorder.criteria.map(criterion => `
                            <li class="list-group-item border-0 border-start border-primary border-3 mb-2 ps-3">
                                ${criterion}
                            </li>
                        `).join('')}
                    </ol>
                    
                    <div class="row mt-4">
                        <div class="col-md-6">
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h6 class="card-title"><i class="fas fa-chart-bar me-2"></i>Prevalencia</h6>
                                    <p class="card-text mb-0">${disorder.prevalence}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h6 class="card-title"><i class="fas fa-pills me-2"></i>Tratamiento</h6>
                                    <p class="card-text mb-0">${disorder.treatment}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="alert alert-warning mt-4 mb-0">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Importante:</strong> Esta información es de referencia profesional. El diagnóstico debe realizarse mediante evaluación clínica completa.
                    </div>
                </div>
            </div>
        `;
        
        printBtn.disabled = false;
        printBtn.onclick = () => printCriteriaCard(disorder, category);
    });
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('criteriaModal'));
    modal.show();
}

function printCriteriaCard(disorder, category) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${disorder.name} - Criterios DSM-5</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
                h2 { color: #34495e; margin-top: 30px; }
                .code { background: #f8f9fa; padding: 10px; border-left: 4px solid #3498db; margin: 20px 0; }
                ol { line-height: 1.8; }
                .info-box { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 30px; }
                @media print { button { display: none; } }
            </style>
        </head>
        <body>
            <h1>${disorder.name}</h1>
            <div class="code"><strong>Código DSM-5:</strong> ${disorder.code}</div>
            <p><strong>Categoría:</strong> ${category.title}</p>
            <p>${disorder.description}</p>
            
            <h2>Criterios Diagnósticos</h2>
            <ol>
                ${disorder.criteria.map(c => `<li>${c}</li>`).join('')}
            </ol>
            
            <div class="info-box">
                <p><strong>Prevalencia:</strong> ${disorder.prevalence}</p>
                <p><strong>Tratamiento:</strong> ${disorder.treatment}</p>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong> Esta información es de referencia profesional. 
                El diagnóstico debe realizarse mediante evaluación clínica completa por un profesional de salud mental calificado.
            </div>
            
            <div style="margin-top: 40px; text-align: center; color: #7f8c8d; font-size: 12px;">
                <p>PsiquiApp - Guía DSM-5</p>
                <p>Impreso: ${new Date().toLocaleString('es-ES')}</p>
            </div>
            
            <button onclick="window.print()" style="margin: 20px auto; display: block; padding: 10px 30px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Imprimir</button>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function downloadGuide() {
    // URL de recursos oficiales DSM-5 de la American Psychiatric Association
    const dsm5ResourcesUrl = 'https://www.psychiatry.org/psychiatrists/practice/dsm';
    
    // Mostrar mensaje
    showNotification('Abriendo recursos oficiales DSM-5 de la APA...', 'info');
    
    // Abrir en nueva pestaña
    window.open(dsm5ResourcesUrl, '_blank');
    
    // Mostrar mensaje de éxito
    setTimeout(() => {
        showNotification('Recursos DSM-5 abiertos. Puede consultar la información oficial de la APA.', 'success');
    }, 1000);
}

function openReferences() {
    alert('Función de referencias - Por implementar');
}

// Función para mostrar detalles específicos de un trastorno DSM-5
function showDisorderDetails(code, name, categoryKey) {
    // Base de datos detallada de trastornos DSM-5
    const disorderDetails = {
        // Trastornos del Neurodesarrollo
        '299.00': {
            name: 'Trastorno del espectro autista',
            description: 'Trastorno del neurodesarrollo caracterizado por déficits persistentes en comunicación e interacción social',
            criteriaA: [
                'Déficits en reciprocidad socioemocional (desde acercamientos sociales anormales hasta conversación reducida)',
                'Déficits en conductas comunicativas no verbales (contacto visual pobre, expresiones faciales reducidas)',
                'Déficits en desarrollar, mantener y entender relaciones (dificultad para ajustar comportamiento a contextos sociales)'
            ],
            criteriaB: [
                'Patrones repetitivos y restringidos de comportamiento, intereses o actividades (2 o más):',
                'Movimientos motores estereotipados (aleteo de manos, balanceo)',
                'Insistencia en la monotonía, rutinas inflexibles, patrones ritualizados',
                'Intereses fijos altamente restringidos e intensos',
                'Hiper o hipoactividad a estímulos sensoriales del entorno'
            ],
            clinicalFeatures: [
                'Síntomas presentes desde período de desarrollo temprano',
                'Los síntomas causan deterioro clínicamente significativo',
                'No se explica mejor por discapacidad intelectual o retraso global del desarrollo'
            ],
            specifiers: [
                'Con o sin deterioro intelectual acompañante',
                'Con o sin deterioro del lenguaje acompañante',
                'Asociado con condición médica, genética o factor ambiental conocido',
                'Niveles de apoyo: Requiere apoyo / Requiere apoyo sustancial / Requiere apoyo muy sustancial'
            ],
            differentialDx: [
                'Trastorno del lenguaje - No presenta patrones repetitivos ni intereses restringidos',
                'Discapacidad intelectual - Déficits sociales/comunicativos acordes con nivel de desarrollo',
                'Trastorno de la comunicación social - Ausencia de comportamientos repetitivos',
                'TDAH - Puede coexistir, diferencias en patrones de atención'
            ],
            treatment: [
                'Intervención conductual temprana intensiva (ABA - 25-40 horas/semana)',
                'Terapia del habla y lenguaje',
                'Terapia ocupacional para integración sensorial',
                'Entrenamiento en habilidades sociales',
                'Educación estructurada (TEACCH)',
                'Farmacoterapia para síntomas específicos: Risperidona/Aripiprazol para irritabilidad'
            ],
            prognosis: 'Variable según nivel de funcionamiento. Intervención temprana mejora significativamente el pronóstico',
            prevalence: '1 en 36-44 niños (CDC 2023), Proporción M:F = 4:1',
            clinicalPearls: [
                'Evaluar regresión del lenguaje después de los 15 meses (síndrome de Rett diferencial)',
                'Considerar evaluación genética si hay dismorfias o antecedentes familiares',
                'Screening con M-CHAT-R a los 16-30 meses en atención primaria',
                'Comorbilidad frecuente con epilepsia (25%), TDAH (28%), ansiedad (40%)'
            ]
        },
        '314.01': {
            name: 'TDAH combinado',
            description: 'Trastorno del neurodesarrollo caracterizado por niveles inadecuados de atención e hiperactividad-impulsividad',
            criteriaA: [
                'Inatención (6+ síntomas ≥6 meses, 5+ si ≥17 años):',
                'No presta atención a detalles, errores por descuido',
                'Dificultad para mantener atención en tareas',
                'Parece no escuchar cuando se le habla directamente',
                'No sigue instrucciones, no termina tareas',
                'Dificultad para organizar tareas y actividades',
                'Evita tareas que requieren esfuerzo mental sostenido',
                'Pierde objetos necesarios para tareas',
                'Se distrae fácilmente con estímulos externos',
                'Olvida actividades diarias'
            ],
            criteriaB: [
                'Hiperactividad-Impulsividad (6+ síntomas ≥6 meses, 5+ si ≥17 años):',
                'Mueve manos/pies o se retuerce en asiento',
                'Abandona asiento cuando debe permanecer sentado',
                'Corre o trepa en situaciones inapropiadas',
                'No puede jugar o realizar actividades tranquilamente',
                'Actúa como si fuera "impulsado por un motor"',
                'Habla excesivamente',
                'Responde antes de que terminen las preguntas',
                'Dificultad para esperar su turno',
                'Interrumpe o se inmiscuye con otros'
            ],
            clinicalFeatures: [
                'Varios síntomas presentes antes de los 12 años',
                'Síntomas presentes en 2+ ambientes (casa, escuela, trabajo)',
                'Deterioro clínicamente significativo en funcionamiento',
                'No ocurre exclusivamente durante esquizofrenia u otro trastorno psicótico'
            ],
            specifiers: [
                'Presentación combinada (criterios A1 y A2 cumplidos)',
                'Presentación predominantemente inatenta (criterio A1)',
                'Presentación predominantemente hiperactiva/impulsiva (criterio A2)',
                'En remisión parcial (criterios previamente cumplidos, algunos síntomas persisten)'
            ],
            differentialDx: [
                'Trastorno oposicional desafiante - Negativismo no relacionado con atención',
                'Trastorno del espectro autista - Dificultades específicas en contextos sociales',
                'Discapacidad intelectual - Inatención acorde con capacidad mental',
                'Trastornos del estado de ánimo - Síntomas durante episodios afectivos',
                'Trastornos de ansiedad - Inatención por preocupaciones'
            ],
            treatment: [
                'Primera línea: Estimulantes (Metilfenidato 18-72mg/día, Anfetaminas 10-70mg/día)',
                'Segunda línea: No estimulantes (Atomoxetina 40-100mg/día, Guanfacina XR)',
                'Terapia conductual: Entrenamiento a padres, modificación conductual',
                'Terapia cognitivo-conductual para adolescentes/adultos',
                'Acomodaciones académicas/laborales',
                'Entrenamiento en habilidades organizacionales'
            ],
            prognosis: '60-70% continúa en adultez. Tratamiento mejora funcionamiento significativamente',
            prevalence: '5% en niños, 2.5% en adultos. Proporción M:F = 2:1',
            clinicalPearls: [
                'Monitoreo cardiovascular antes de iniciar estimulantes (ECG si factores de riesgo)',
                'Vigilar crecimiento en niños (peso/talla cada 3 meses)',
                'Evaluar abuso de sustancias antes de prescribir estimulantes',
                'Considerar trastornos del sueño comórbidos (50% prevalencia)'
            ]
        },
        // Trastornos Psicóticos
        '295.90': {
            name: 'Esquizofrenia',
            description: 'Trastorno psicótico caracterizado por delirios, alucinaciones, pensamiento desorganizado y comportamiento anormal',
            criteriaA: [
                'Dos o más de los siguientes durante período de 1 mes (al menos uno debe ser 1, 2 o 3):',
                '1. Delirios (ideas falsas fijas, resistentes a evidencia contraria)',
                '2. Alucinaciones (percepciones sin estímulo externo, típicamente auditivas)',
                '3. Lenguaje desorganizado (descarrilamiento frecuente, incoherencia)',
                '4. Comportamiento catatónico o gravemente desorganizado',
                '5. Síntomas negativos (expresión emocional disminuida, abulia, alogia, anhedonia, asociabilidad)'
            ],
            criteriaB: [
                'Funcionamiento deteriorado en trabajo, relaciones interpersonales o autocuidado',
                'Nivel marcadamente por debajo del previo al inicio',
                'Si inicio en infancia/adolescencia, falla en alcanzar nivel esperado'
            ],
            clinicalFeatures: [
                'Duración: Signos continuos por al menos 6 meses',
                'Incluye al menos 1 mes de síntomas del Criterio A',
                'Puede incluir períodos prodrómicos o residuales',
                'Exclusión de trastorno esquizoafectivo y del estado de ánimo',
                'No es atribuible a sustancias o condición médica'
            ],
            specifiers: [
                'Primer episodio / Múltiples episodios',
                'Actualmente en episodio agudo / En remisión parcial / En remisión completa',
                'Con catatonia',
                'Curso: Episódico / Continuo / No especificado',
                'Con características prominentes del estado de ánimo'
            ],
            differentialDx: [
                'Trastorno esquizoafectivo - Síntomas afectivos prominentes',
                'Trastorno del estado de ánimo con características psicóticas - Psicosis solo durante episodios afectivos',
                'Trastorno psicótico inducido por sustancias - Relación temporal con intoxicación/abstinencia',
                'Trastorno psicótico debido a condición médica - Evidencia de causa médica',
                'Trastorno delirante - Solo delirios, funcionamiento preservado fuera de tema delirante'
            ],
            treatment: [
                'Antipsicóticos de segunda generación (preferidos): Risperidona 2-8mg/día, Olanzapina 10-20mg/día, Quetiapina 300-800mg/día',
                'Antipsicóticos de primera generación: Haloperidol 5-20mg/día (mayor riesgo de efectos extrapiramidales)',
                'LAI (inyectables de acción prolongada) para adherencia: Paliperidona palmitato, Olanzapina pamoato',
                'Clozapina para esquizofrenia resistente al tratamiento (requiere monitoreo hemático)',
                'Rehabilitación psicosocial: Entrenamiento en habilidades sociales, terapia ocupacional',
                'Psicoeducación familiar, apoyo comunitario, manejo de caso'
            ],
            prognosis: 'Variable. 20% recuperación completa, 60% mejoría con tratamiento, 20% curso deteriorante',
            prevalence: '0.3-0.7% poblacional. Inicio típico: Hombres 18-25 años, Mujeres 25-35 años',
            clinicalPearls: [
                'Evaluar función cognitiva (77% presenta déficits cognitivos)',
                'Screening de sustancias (50% comorbilidad con trastornos por sustancias)',
                'Monitoreo metabólico con antipsicóticos atípicos (peso, glucosa, lípidos)',
                'Riesgo suicida aumentado (5-6% lifetime), especialmente primeros años'
            ]
        },
        // Trastornos Depresivos
        '296.21': {
            name: 'Trastorno depresivo mayor, episodio único',
            description: 'Episodio de depresión mayor caracterizado por estado de ánimo deprimido o pérdida de interés',
            criteriaA: [
                'Cinco o más síntomas durante período de 2 semanas (al menos uno debe ser 1 o 2):',
                '1. Estado de ánimo deprimido la mayor parte del día, casi todos los días',
                '2. Disminución marcada del interés o placer en todas/casi todas las actividades',
                '3. Pérdida significativa de peso sin dieta o aumento de peso (>5% en 1 mes)',
                '4. Insomnio o hipersomnia casi todos los días',
                '5. Agitación o retraso psicomotor (observable por otros)',
                '6. Fatiga o pérdida de energía casi todos los días',
                '7. Sentimientos de inutilidad o culpa excesiva/inapropiada',
                '8. Capacidad disminuida para pensar/concentrarse o indecisión',
                '9. Pensamientos recurrentes de muerte, ideación suicida, plan o intento suicida'
            ],
            criteriaB: [
                'Los síntomas causan malestar clínicamente significativo',
                'Deterioro en funcionamiento social, laboral u otras áreas importantes',
                'No son atribuibles a efectos fisiológicos de sustancia o condición médica'
            ],
            clinicalFeatures: [
                'Nunca ha habido episodio maníaco o hipomaníaco',
                'No se explica mejor por trastornos del espectro esquizofrénico',
                'Puede presentar características melancólicas, atípicas o psicóticas',
                'Riesgo suicida significativo (evaluación obligatoria)'
            ],
            specifiers: [
                'Con características melancólicas (anhedonia, despertar matutino, humor peor por mañana)',
                'Con características atípicas (reactividad del humor, hipersomnia, hiperfagia)',
                'Con características psicóticas (congruentes o incongruentes con el estado de ánimo)',
                'Con características mixtas (síntomas hipomaníacos subsindromáticos)',
                'Con catatonia',
                'Con inicio en el periparto (durante embarazo o 4 semanas postparto)'
            ],
            differentialDx: [
                'Trastorno bipolar - Historia de episodios maníacos/hipomaníacos',
                'Trastorno depresivo persistente - Duración ≥2 años, menos severo',
                'Trastorno de adaptación con estado de ánimo deprimido - Respuesta a estresor identificable',
                'Trastorno depresivo inducido por sustancias - Relación temporal con sustancia',
                'Duelo normal - Menos duración e intensidad, ondas de tristeza'
            ],
            treatment: [
                'ISRS primera línea: Sertralina 50-200mg/día, Escitalopram 10-20mg/día, Fluoxetina 20-60mg/día',
                'IRSN: Venlafaxina XR 75-225mg/día, Duloxetina 30-60mg/día',
                'Antidepresivos atípicos: Bupropión XL 150-450mg/día, Mirtazapina 15-45mg/día',
                'Psicoterapia: TCC (16-20 sesiones), Terapia interpersonal, Activación conductual',
                'Casos severos/resistentes: TEC, Estimulación magnética transcraneal (EMT)',
                'Ketamina/Esketamina para depresión resistente al tratamiento'
            ],
            prognosis: '50-85% respuesta al tratamiento. Riesgo de recurrencia 50-80% sin mantenimiento',
            prevalence: '8.5% anual, 20.6% lifetime. Proporción F:M = 2:1, inicio típico 20-30 años',
            clinicalPearls: [
                'Columbia Suicide Severity Rating Scale para evaluación de riesgo suicida',
                'PHQ-9 útil para screening y seguimiento (score ≥10 sugiere depresión mayor)',
                'Latencia de respuesta: 2-4 semanas para síntomas, 6-8 semanas para respuesta completa',
                'Síndrome de discontinuación con ISRS/IRSN (reducir gradualmente)'
            ]
        },
        // Trastornos de Ansiedad
        '300.02': {
            name: 'Trastorno de ansiedad generalizada',
            description: 'Ansiedad y preocupación excesivas acerca de varios eventos o actividades',
            criteriaA: [
                'Ansiedad y preocupación excesivas durante más días que no durante 6+ meses',
                'Sobre varios eventos o actividades (trabajo, escuela, rendimiento)',
                'Dificultad para controlar la preocupación'
            ],
            criteriaB: [
                'Ansiedad/preocupación asociada con 3+ síntomas (1+ en niños):',
                'Inquietud o sensación de estar en el límite',
                'Fatiga fácil',
                'Dificultad para concentrarse o mente en blanco',
                'Irritabilidad',
                'Tensión muscular',
                'Trastorno del sueño (dificultad para conciliar/mantener sueño, sueño no reparador)'
            ],
            clinicalFeatures: [
                'Ansiedad/preocupación/síntomas físicos causan malestar clínicamente significativo',
                'Deterioro en funcionamiento social, laboral u otras áreas importantes',
                'No atribuible a efectos fisiológicos de sustancia o condición médica',
                'No se explica mejor por otro trastorno mental'
            ],
            specifiers: [
                'Con insight bueno/regular (reconoce creencias como desproporcionadas)',
                'Con insight pobre (piensa que creencias son probablemente ciertas)',
                'Con insight ausente/creencias delirantes (completamente convencido que creencias son ciertas)'
            ],
            differentialDx: [
                'Trastorno de ansiedad por separación - Preocupación específica por separación',
                'Trastorno de ansiedad social - Preocupación específica por situaciones sociales',
                'Trastorno obsesivo-compulsivo - Preocupaciones son obsesiones',
                'Trastorno de estrés postraumático - Ansiedad relacionada con trauma',
                'Trastorno de adaptación - Respuesta a estresor específico identificable'
            ],
            treatment: [
                'ISRS primera línea: Escitalopram 10-20mg/día, Paroxetina 20-50mg/día',
                'IRSN: Venlafaxina XR 75-225mg/día, Duloxetina 30-120mg/día',
                'Benzodiacepinas (corto plazo): Lorazepam 0.5-2mg TID, Clonazepam 0.25-1mg BID',
                'Pregabalina 150-600mg/día dividido',
                'TCC especializada para TAG (14-20 sesiones)',
                'Técnicas de relajación, mindfulness, manejo del estrés',
                'Evitar cafeína, alcohol; ejercicio regular'
            ],
            prognosis: 'Curso crónico con fluctuaciones. 50-60% respuesta al tratamiento combinado',
            prevalence: '2.9% anual, 5.7% lifetime. Proporción F:M = 2:1, inicio típico 20-30 años',
            clinicalPearls: [
                'GAD-7 útil para screening (score ≥10 sugiere TAG)',
                'Comorbilidad alta con depresión (62% lifetime)',
                'Benzodiacepinas: riesgo de dependencia, evitar uso prolongado',
                'Síntomas somáticos prominentes pueden confundir con condiciones médicas'
            ]
        },
        // Trastornos de la Personalidad
        '301.83': {
            name: 'Trastorno límite de la personalidad',
            description: 'Patrón dominante de inestabilidad de las relaciones interpersonales, autoimagen y afectos, e impulsividad marcada',
            criteriaA: [
                'Patrón presente en diversos contextos, inicio en adultos tempranos, indicado por 5+ de:',
                '1. Esfuerzos desesperados para evitar abandono real o imaginado',
                '2. Patrón de relaciones interpersonales inestables e intensas (idealización/devaluación)',
                '3. Alteración de la identidad: autoimagen o sentido de sí mismo inestables',
                '4. Impulsividad en ≥2 áreas potencialmente dañinas (gastos, sexo, sustancias, conducción)',
                '5. Comportamientos, intentos o amenazas suicidas recurrentes, o automutilación',
                '6. Inestabilidad afectiva: reactividad marcada del estado de ánimo',
                '7. Sentimientos crónicos de vacío',
                '8. Ira inapropiada e intensa o dificultad para controlar la ira',
                '9. Ideación paranoide transitoria relacionada con estrés o síntomas disociativos graves'
            ],
            clinicalFeatures: [
                'Patrón comienza en adultos tempranos, presente en diversos contextos',
                'Alto riesgo suicida (8-10% tasa de suicidio)',
                'Frecuente comorbilidad con trastornos del estado de ánimo, ansiedad, sustancias',
                'Funcionamiento interpersonal y laboral significativamente deteriorado'
            ],
            specifiers: [
                'No hay especificadores oficiales',
                'Puede coexistir con otros trastornos de personalidad',
                'Considerar dimensional vs categorial en DSM-5-TR'
            ],
            differentialDx: [
                'Trastorno del estado de ánimo - TLP presenta inestabilidad afectiva más persistente',
                'Trastorno histriónico - TLP más autodestructivo, sentimientos de vacío',
                'Trastorno narcisista - TLP presenta autoimagen más inestable',
                'Trastorno antisocial - TLP manipulación por miedo al abandono vs ganancia',
                'Trastorno de identidad disociativo - En TLP disociación por estrés'
            ],
            treatment: [
                'Terapia Dialéctica Conductual (DBT) - Gold standard, evidencia más sólida',
                'Terapia Basada en Mentalización (MBT) - Eficaz para funcionamiento interpersonal',
                'Terapia Focalizada en Transferencia (TFP) - Abordaje psicodinámico estructurado',
                'Farmacoterapia sintomática: ISRS para afecto, Lamotrigina para impulsividad',
                'Antipsicóticos atípicos dosis bajas para síntomas cognitivo-perceptuales',
                'Evitar benzodiacepinas (riesgo de desinhibición e impulsividad)'
            ],
            prognosis: 'Mejoría gradual con tratamiento especializado. 50% ya no cumple criterios a los 10 años',
            prevalence: '0.7% población general, 10% pacientes ambulatorios, 20% hospitalizados. Proporción F:M = 3:1',
            clinicalPearls: [
                'SAMHSA Risk Assessment Tool útil para evaluación de riesgo suicida',
                'Monitoreo estrecho durante primeras semanas de tratamiento',
                'Evitar polifarmacia, enfoque sintomático específico',
                'DBT reduce intentos suicidas en 50% vs tratamiento usual'
            ]
        },

        // Trastorno Bipolar I
        '296.41': {
            name: 'Trastorno bipolar I, episodio maníaco actual',
            description: 'Trastorno del estado de ánimo caracterizado por episodios maníacos, con o sin episodios depresivos',
            criteriaA: [
                'Episodio Maníaco (período ≥1 semana de estado de ánimo elevado/irritable + 3+ síntomas):',
                'Autoestima exagerada o grandiosidad',
                'Disminución de la necesidad de dormir (se siente descansado con 3 horas)',
                'Más hablador de lo usual o presión por hablar',
                'Fuga de ideas o experiencia subjetiva de pensamientos acelerados',
                'Distraibilidad (atención fácilmente desviada)',
                'Aumento en actividad dirigida a objetivos o agitación psicomotora',
                'Implicación excesiva en actividades con alto potencial de consecuencias dolorosas'
            ],
            criteriaB: [
                'El episodio causa deterioro marcado en funcionamiento',
                'O requiere hospitalización para prevenir daño a sí mismo o a otros',
                'O hay características psicóticas',
                'No es atribuible a sustancias o condición médica'
            ],
            clinicalFeatures: [
                'Al menos un episodio maníaco define Bipolar I',
                'Episodios depresivos mayores son comunes pero no requeridos para diagnóstico',
                'Episodios hipomaníacos pueden ocurrir antes o después de episodios maníacos',
                'Riesgo significativo de recurrencia (90% tendrá episodios futuros)'
            ],
            specifiers: [
                'Con características ansiosas (tensión, inquietud, concentración pobre)',
                'Con características mixtas (síntomas depresivos durante manía)',
                'Con características psicóticas (congruentes o incongruentes con estado de ánimo)',
                'Con catatonia',
                'Con inicio en periparto (durante embarazo o 4 semanas postparto)',
                'Con patrón estacional'
            ],
            differentialDx: [
                'Episodio hipomaníaco - Duración menor, menos severidad, no requiere hospitalización',
                'Trastorno depresivo mayor con características mixtas - No hay episodio maníaco completo',
                'Trastorno esquizoafectivo - Síntomas psicóticos fuera de episodios afectivos',
                'Trastorno inducido por sustancias - Relación temporal clara con sustancia',
                'Condiciones médicas - Hipertiroidismo, lesiones cerebrales'
            ],
            treatment: [
                'Episodio agudo: Litio 600-1200mg/día (nivel sérico 0.8-1.2), Valproato 1000-2000mg/día',
                'Antipsicóticos atípicos: Olanzapina 10-20mg/día, Quetiapina 400-800mg/día, Aripiprazol 15-30mg/día',
                'Mantenimiento: Litio (gold standard), Lamotrigina para prevención depresiva',
                'Terapia psicológica: Psicoeducación, terapia familiar, TCC, terapia interpersonal y de ritmos sociales',
                'Manejo de crisis: Hospitalización si riesgo para sí mismo o terceros',
                'Evitar antidepresivos como monoterapia (riesgo de switch maníaco)'
            ],
            prognosis: 'Curso recurrente. Con tratamiento: 50-60% funcionamiento bueno. Sin tratamiento: deterioro significativo',
            prevalence: '0.6% lifetime. Inicio típico: final adolescencia/adultos jóvenes (18-29 años). Sin diferencia de género',
            clinicalPearls: [
                'Monitoreo de litio: función renal, tiroidea, ECG (especialmente >40 años)',
                'Riesgo suicida muy alto (15-20 veces población general)',
                'Comorbilidad frecuente: trastornos de ansiedad (75%), abuso de sustancias (60%)',
                'Episodios mixtos tienen mayor riesgo suicida y peor pronóstico'
            ]
        },

        // Trastorno de Pánico
        '300.01': {
            name: 'Trastorno de pánico',
            description: 'Ataques de pánico recurrentes e inesperados',
            criteriaA: [
                'Ataques de pánico recurrentes e inesperados',
                'Ataque de pánico: oleada abrupta de miedo intenso/malestar que alcanza pico en minutos',
                'Durante el pico, 4+ de los siguientes síntomas:',
                'Palpitaciones, corazón acelerado o taquicardia',
                'Sudoración',
                'Temblores o sacudidas',
                'Sensaciones de ahogo o falta de aliento',
                'Sensación de asfixia',
                'Dolor o molestias en el pecho',
                'Náuseas o molestias abdominales',
                'Mareo, inestabilidad, vahído o desmayo',
                'Escalofríos o sofocaciones',
                'Parestesias',
                'Desrealización o despersonalización',
                'Miedo a perder el control o "volverse loco"',
                'Miedo a morir'
            ],
            criteriaB: [
                'Al menos uno de los ataques ha sido seguido por 1+ mes de:',
                'Preocupación persistente por ataques adicionales o sus consecuencias',
                'Cambio desadaptativo significativo en comportamiento relacionado con ataques'
            ],
            clinicalFeatures: [
                'Los ataques no son atribuibles a sustancias o condición médica',
                'No se explican mejor por otro trastorno mental',
                'Pueden desarrollar agorafobia secundaria',
                'Frecuente comorbilidad con otros trastornos de ansiedad'
            ],
            differentialDx: [
                'Condiciones médicas - Hipertiroidismo, feocromocitoma, arritmias cardíacas',
                'Trastorno inducido por sustancias - Cafeína, estimulantes, abstinencia',
                'Otros trastornos de ansiedad - Fobia específica, ansiedad social',
                'Trastorno obsesivo-compulsivo - Ataques en respuesta a obsesiones',
                'Trastorno de estrés postraumático - Ataques en respuesta a recordatorios del trauma'
            ],
            treatment: [
                'ISRS: Sertralina 25-200mg/día, Paroxetina 10-60mg/día',
                'Benzodiacepinas para crisis: Alprazolam 0.25-0.5mg PRN, Clonazepam 0.5mg PRN',
                'TCC específica para pánico (12-15 sesiones)',
                'Terapia de exposición interoceptiva',
                'Técnicas de respiración y relajación',
                'Educación sobre naturaleza benigna de síntomas de pánico'
            ],
            prognosis: '70-80% respuesta al tratamiento. Riesgo de recaída si discontinúa tratamiento abruptamente',
            prevalence: '2.7% anual, 4.7% lifetime. Proporción F:M = 2:1, inicio típico final adolescencia/adultos jóvenes',
            clinicalPearls: [
                'Descartar causas médicas: ECG, TSH, glucosa si primer episodio',
                'Educación: los síntomas de pánico no son peligrosos ni causan daño físico',
                'Evitar benzodiacepinas de acción corta (riesgo de rebote)',
                'Comorbilidad con agorafobia en 30-50% de casos'
            ]
        },

        // Trastorno Obsesivo-Compulsivo
        '300.3': {
            name: 'Trastorno obsesivo-compulsivo',
            description: 'Presencia de obsesiones y/o compulsiones que consumen tiempo y causan malestar significativo',
            criteriaA: [
                'Presencia de obsesiones, compulsiones o ambas:',
                'OBSESIONES (pensamientos, impulsos o imágenes recurrentes y persistentes):',
                '• Experimentados como intrusivos e indeseados',
                '• Causan ansiedad o malestar marcados',
                '• La persona intenta ignorarlos, suprimirlos o neutralizarlos',
                'COMPULSIONES (comportamientos repetitivos o actos mentales):',
                '• Se siente impulsado a realizarlos en respuesta a obsesión',
                '• Dirigidos a prevenir/reducir ansiedad o prevenir evento temido',
                '• No conectados de manera realista o claramente excesivos'
            ],
            criteriaB: [
                'Las obsesiones/compulsiones consumen tiempo (>1 hora/día)',
                'O causan malestar clínicamente significativo',
                'O deterioro en funcionamiento social, laboral u otras áreas importantes'
            ],
            clinicalFeatures: [
                'Los síntomas no son atribuibles a sustancias o condición médica',
                'No se explican mejor por síntomas de otro trastorno mental',
                'Insight variable (bueno/regular, pobre, ausente)',
                'Frecuente comorbilidad con depresión y trastornos de ansiedad'
            ],
            specifiers: [
                'Con insight bueno/regular (reconoce creencias TOC como falsas/exageradas)',
                'Con insight pobre (piensa que creencias TOC son probablemente ciertas)',
                'Con insight ausente/creencias delirantes (completamente convencido)',
                'Relacionado con tics (antecedente personal/familiar de trastorno de tics)'
            ],
            differentialDx: [
                'Trastorno de ansiedad generalizada - Preocupaciones realistas vs obsesiones',
                'Fobias específicas - Evitación vs compulsiones',
                'Trastorno del espectro autista - Comportamientos restringidos y repetitivos',
                'Tricotilomanía/excoriación - Comportamiento repetitivo enfocado al cuerpo',
                'Trastorno obsesivo-compulsivo de la personalidad - Rasgos de personalidad vs síntomas'
            ],
            treatment: [
                'ISRS dosis altas: Fluoxetina 40-80mg/día, Sertralina 100-200mg/día, Fluvoxamina 200-300mg/día',
                'Clomipramina 150-250mg/día (tricíclico específico para TOC)',
                'TCC con Exposición y Prevención de Respuesta (EPR) - 16-20 sesiones',
                'Casos severos/resistentes: Cirugía (cingulotomía), Estimulación cerebral profunda',
                'Potenciación: Antipsicóticos atípicos (Aripiprazol, Risperidona)',
                'Terapia familiar y psicoeducación sobre naturaleza del TOC'
            ],
            prognosis: '70% respuesta parcial al tratamiento. Curso típicamente crónico con fluctuaciones',
            prevalence: '1.2% anual, 2.3% lifetime. Sin diferencia de género. Inicio bimodal: infancia (6-15 años) y adultos jóvenes',
            clinicalPearls: [
                'Yale-Brown Obsessive Compulsive Scale (Y-BOCS) para seguimiento',
                'Latencia de respuesta más larga que depresión (8-12 semanas)',
                'Comorbilidad con trastornos de tics en 30% (inicio temprano)',
                'PANDAS en niños: TOC de inicio abrupto post-infección estreptocócica'
            ]
        },
        '300.4': {
            name: 'Trastorno depresivo persistente (Distimia)',
            description: 'Estado de ánimo deprimido durante la mayor parte del día, más días que no, durante al menos 2 años',
            criteriaA: [
                'Estado de ánimo deprimido la mayor parte del día, más días que no',
                'Durante 2+ años en adultos (1+ año en niños/adolescentes)',
                'Cuando está deprimido, presenta 2+ de los siguientes:',
                '• Apetito disminuido o ingesta excesiva',
                '• Insomnio o hipersomnia',
                '• Poca energía o fatiga',
                '• Baja autoestima',
                '• Falta de concentración o dificultad para tomar decisiones',
                '• Sentimientos de desesperanza'
            ],
            criteriaB: [
                'Durante período de 2 años, nunca sin síntomas >2 meses seguidos',
                'Puede haber episodios depresivos mayores superpuestos',
                'Nunca ha habido episodio maníaco o hipomaníaco',
                'No se explica mejor por trastorno psicótico crónico'
            ],
            clinicalFeatures: [
                'Inicio temprano (antes de 21 años) o tardío (21+ años)',
                'Los síntomas causan malestar clínicamente significativo o deterioro funcional',
                'No atribuible a sustancias o condición médica',
                'Riesgo aumentado de desarrollar episodio depresivo mayor'
            ],
            specifiers: [
                'Con síndrome distímico puro (nunca episodio depresivo mayor en 2 años)',
                'Con episodio depresivo mayor persistente (durante todo el período de 2 años)',
                'Con episodios depresivos mayores intermitentes (actualmente en episodio o no)',
                'Inicio temprano: Antes de 21 años / Inicio tardío: 21+ años',
                'Con características melancólicas, atípicas, o psicóticas (si aplica)'
            ],
            differentialDx: [
                'Trastorno depresivo mayor - Episodios discretos vs síntomas crónicos',
                'Trastorno ciclotímico - Fluctuaciones con síntomas hipomaníacos',
                'Trastornos de la personalidad - Patrones de comportamiento vs síntomas depresivos',
                'Trastorno depresivo inducido por sustancias - Relación temporal con uso de sustancias',
                'Hipotiroidismo - Descartar causa médica'
            ],
            treatment: [
                'ISRS: Sertralina 50-200mg/día, Escitalopram 10-20mg/día, Fluoxetina 20-40mg/día',
                'IRSN: Venlafaxina XR 75-225mg/día, Duloxetina 30-60mg/día',
                'Psicoterapia de larga duración: TCC, Terapia interpersonal, CBASP (específica para distimia)',
                'Combinación medicación + psicoterapia más efectiva que monoterapia',
                'Tratamiento prolongado necesario para prevenir recaídas',
                'Activación conductual y manejo del estrés'
            ],
            prognosis: 'Curso crónico. 50% experimentan recuperación completa en 10 años. Riesgo alto de recurrencia',
            prevalence: '0.5% anual, 3-6% lifetime. Proporción F:M = 2:1. Inicio típico en adolescencia/adulto joven',
            clinicalPearls: [
                'PHQ-9 útil para monitoreo continuo de síntomas',
                'Alta comorbilidad con trastornos de ansiedad (50-70%)',
                'Doble depresión: Distimia + episodio depresivo mayor superpuesto',
                'Considerar evaluación de tiroides (TSH) antes de iniciar tratamiento'
            ]
        },
        '296.89': {
            name: 'Trastorno bipolar II',
            description: 'Al menos un episodio hipomaníaco y un episodio depresivo mayor, sin episodios maníacos',
            criteriaA: [
                'Cumple criterios para al menos un episodio hipomaníaco (Criterio A) Y',
                'Cumple criterios para al menos un episodio depresivo mayor (Criterio B)',
                'Nunca ha habido un episodio maníaco completo',
                'Los síntomas no se explican mejor por trastorno esquizoafectivo u otro trastorno psicótico'
            ],
            criteriaB: [
                'EPISODIO HIPOMANÍACO (4+ días):',
                '• Estado de ánimo elevado, expansivo o irritable',
                '• 3+ síntomas: autoestima inflada, disminución de sueño, verborrea, fuga de ideas, distraibilidad, actividad aumentada, actividades riesgosas',
                '• Cambio observable en funcionamiento, PERO sin deterioro severo',
                '• No requiere hospitalización, sin características psicóticas',
                'EPISODIO DEPRESIVO MAYOR (2+ semanas):',
                '• 5+ síntomas depresivos incluyendo ánimo deprimido o anhedonia',
                '• Deterioro significativo en funcionamiento'
            ],
            clinicalFeatures: [
                'Episodios depresivos típicamente más frecuentes y prolongados que hipomaníacos',
                'Deterioro principalmente durante episodios depresivos',
                'Riesgo de transición a Bipolar I es 5-15%',
                'Mayor riesgo suicida que población general'
            ],
            specifiers: [
                'Episodio actual o más reciente: hipomaníaco o deprimido',
                'Con características mixtas, ciclación rápida (≥4 episodios/año)',
                'Con características melancólicas, atípicas, psicóticas, catatónicas',
                'Con inicio en el periparto',
                'Con patrón estacional'
            ],
            differentialDx: [
                'Trastorno bipolar I - Presencia de episodios maníacos completos',
                'Trastorno depresivo mayor - Sin historia de episodios hipomaníacos',
                'Trastorno ciclotímico - Síntomas menos severos, más crónicos',
                'Trastorno bipolar inducido por sustancias - Relación temporal con sustancias',
                'Trastorno límite de la personalidad - Inestabilidad afectiva más reactiva'
            ],
            treatment: [
                'Estabilizadores del ánimo: Litio 600-1200mg/día (nivel 0.6-1.0 mEq/L), Valproato 750-2000mg/día',
                'Anticonvulsivantes: Lamotrigina 100-200mg/día (especialmente para depresión bipolar)',
                'Antipsicóticos atípicos: Quetiapina 300-600mg/día, Lurasidona 20-120mg/día',
                'Antidepresivos SOLO con estabilizador (riesgo de inducir hipomanía)',
                'Psicoterapia: Terapia de ritmos interpersonales y sociales, TCC, psicoeducación',
                'Regulación de ritmos circadianos (sueño, actividad)'
            ],
            prognosis: 'Curso crónico con recurrencias. 40-50% tienen otra recurrencia en 2 años. Mejor pronóstico que Bipolar I',
            prevalence: '0.3% anual, 0.8% lifetime. Sin diferencia clara de género. Inicio típico 20-30 años',
            clinicalPearls: [
                'Mood Disorder Questionnaire (MDQ) para screening de hipomanía',
                'Monitoreo de litio: Nivel sérico, función renal, tiroides cada 6 meses',
                'Antidepresivos pueden inducir cambio a fase hipomaníaca o ciclación rápida',
                'Educar sobre importancia de higiene del sueño para prevenir episodios'
            ]
        },
        '295.70': {
            name: 'Trastorno esquizoafectivo',
            description: 'Período continuo con episodio del estado de ánimo mayor y síntomas psicóticos de esquizofrenia',
            criteriaA: [
                'Período ininterrumpido de enfermedad con:',
                '• Episodio del estado de ánimo mayor (depresivo o maníaco)',
                '• Criterio A de esquizofrenia simultáneamente (2+ síntomas: delirios, alucinaciones, discurso desorganizado, comportamiento desorganizado, síntomas negativos)',
                'Delirios o alucinaciones durante 2+ semanas en AUSENCIA de episodio del estado de ánimo mayor',
                'Síntomas del estado de ánimo presentes durante la mayor parte de la duración total de la enfermedad'
            ],
            criteriaB: [
                'Los síntomas no son atribuibles a sustancias o condición médica',
                'Distinción crítica: Psicosis presente CON y SIN episodio afectivo',
                'Si psicosis solo durante episodios afectivos = Trastorno del estado de ánimo con características psicóticas',
                'Si síntomas afectivos breves respecto a psicosis = Esquizofrenia'
            ],
            clinicalFeatures: [
                'Criterio temporal crítico: ≥2 semanas de psicosis sin síntomas afectivos',
                'Síntomas afectivos deben estar presentes la MAYOR parte del tiempo',
                'Funcionamiento típicamente mejor que esquizofrenia, peor que trastorno bipolar',
                'Curso puede ser episódico o continuo'
            ],
            specifiers: [
                'Tipo bipolar: Episodio maníaco es parte de la presentación',
                'Tipo depresivo: Solo episodios depresivos mayores',
                'Primer episodio / Múltiples episodios',
                'Actualmente agudo / En remisión parcial / En remisión completa',
                'Con catatonia'
            ],
            differentialDx: [
                'Esquizofrenia - Síntomas afectivos breves y no prominentes',
                'Trastorno del estado de ánimo con características psicóticas - Psicosis solo durante episodios afectivos',
                'Trastorno psicótico breve - Duración <1 mes',
                'Trastorno bipolar I con características psicóticas - Psicosis limitada a episodios afectivos',
                'Trastorno delirante - Solo delirios, funcionamiento preservado'
            ],
            treatment: [
                'Antipsicóticos: Risperidona 2-6mg/día, Olanzapina 10-20mg/día, Paliperidona 6-12mg/día',
                'Estabilizadores del ánimo: Litio, Valproato (especialmente tipo bipolar)',
                'Antidepresivos (tipo depresivo): ISRS con monitoreo',
                'Combinación antipsicótico + estabilizador frecuentemente necesaria',
                'Psicoterapia: Terapia familiar, rehabilitación psicosocial, manejo de caso',
                'Tratamiento comunitario asertivo (ACT) para casos severos'
            ],
            prognosis: 'Intermedio entre esquizofrenia y trastornos del estado de ánimo. Mejor que esquizofrenia, peor que bipolar',
            prevalence: '0.3% lifetime. Inicio típico: adultos jóvenes (20-30 años). Ligera predominancia en mujeres',
            clinicalPearls: [
                'Diagnóstico difícil: requiere evaluación longitudinal cuidadosa',
                'Monitoreo metabólico con antipsicóticos atípicos (peso, glucosa, lípidos)',
                'Evaluar riesgo suicida regularmente (mayor que población general)',
                'Registro detallado de timeline de síntomas afectivos vs psicóticos es crucial'
            ]
        },
        '297.1': {
            name: 'Trastorno delirante',
            description: 'Presencia de uno o más delirios durante 1+ mes, sin otros síntomas psicóticos prominentes',
            criteriaA: [
                'Presencia de uno o más delirios durante 1+ mes',
                'Criterio A para esquizofrenia NUNCA ha sido cumplido',
                'Si alucinaciones presentes, no son prominentes y relacionadas al tema delirante',
                'Funcionamiento NO marcadamente deteriorado (excepto impacto del delirio)',
                'Comportamiento NO es obviamente extraño o bizarro'
            ],
            criteriaB: [
                'Si episodios del estado de ánimo ocurren, han sido breves en relación a períodos delirantes',
                'No atribuible a sustancias o condición médica',
                'Mejor respuesta a antipsicóticos que delirios en esquizofrenia',
                'Insight típicamente ausente'
            ],
            clinicalFeatures: [
                'Delirios no bizarros (situaciones plausibles en la vida real)',
                'Funcionamiento preservado fuera del área del delirio',
                'Respuesta emocional apropiada al contenido delirante',
                'Curso típicamente crónico, puede remitir y recaer'
            ],
            specifiers: [
                'Tipo erotomaníaco: Otra persona enamorada del paciente',
                'Tipo de grandeza: Convicción de talento o descubrimiento especial',
                'Tipo celotípico: Cónyuge/pareja infiel',
                'Tipo persecutorio: Conspiración contra él/ella (más común)',
                'Tipo somático: Defecto físico o enfermedad médica',
                'Tipo mixto: Más de un tema',
                'Tipo no especificado'
            ],
            differentialDx: [
                'Esquizofrenia - Múltiples síntomas psicóticos, deterioro marcado',
                'Trastorno obsesivo-compulsivo - Reconoce pensamientos como irracionales',
                'Trastorno dismórfico corporal - Preocupación por defecto percibido',
                'Trastorno delirante compartido (folie à deux) - Delirio adoptado de otro',
                'Condiciones médicas: Demencia, delirium, lesiones cerebrales'
            ],
            treatment: [
                'Antipsicóticos primera línea: Risperidona 2-8mg/día, Olanzapina 5-20mg/día, Aripiprazol 10-30mg/día',
                'Tratamiento prolongado (meses-años) típicamente necesario',
                'Psicoterapia de apoyo (insight limitado dificulta TCC)',
                'Manejo de complicaciones (violencia en tipo celotípico/persecutorio)',
                'Tratamiento de condiciones comórbidas (depresión, ansiedad)',
                'Evitar confrontación directa del delirio'
            ],
            prognosis: 'Variable. Curso típicamente crónico. 50% remisión, 20% disminución de síntomas, 30% sin cambio',
            prevalence: '0.02% lifetime. Igual en hombres y mujeres. Inicio típico: mediana edad (40-49 años)',
            clinicalPearls: [
                'Tipo persecutorio más común, puede resultar en comportamiento violento',
                'Tipo celotípico asociado con violencia doméstica',
                'Evaluar seguridad del paciente y otros (especialmente en delirios persecutorios)',
                'Difícil de tratar: baja adherencia, insight limitado'
            ]
        },
        '300.7': {
            name: 'Trastorno dismórfico corporal',
            description: 'Preocupación por defectos percibidos en apariencia física no observables o poco notorios para otros',
            criteriaA: [
                'Preocupación por uno o más defectos percibidos en la apariencia física',
                'Los defectos no son observables o parecen leves a otros',
                'En algún momento ha realizado comportamientos repetitivos en respuesta:',
                '• Mirarse al espejo, arreglarse excesivamente',
                '• Rascarse la piel para mejorar defectos',
                '• Buscar tranquilización',
                '• Compararse con otros'
            ],
            criteriaB: [
                'La preocupación causa malestar clínicamente significativo o deterioro funcional',
                'La preocupación no se explica mejor por trastorno alimentario (si solo sobre peso)',
                'Alta tasa de ideación suicida y comportamiento suicida',
                'Insight variable: bueno, pobre, ausente/delirante'
            ],
            clinicalFeatures: [
                'Áreas de preocupación comunes: piel, cabello, nariz, ojos, dientes, peso',
                'Múltiples áreas de preocupación son comunes',
                'Preocupaciones pueden cambiar a lo largo del tiempo',
                'Evitación social, aislamiento, deterioro ocupacional'
            ],
            specifiers: [
                'Con dismorfia muscular (preocupación de que cuerpo es pequeño/poco musculoso)',
                'Con insight bueno/regular: Reconoce que creencias probablemente no son ciertas',
                'Con insight pobre: Piensa que creencias probablemente son ciertas',
                'Con insight ausente/creencias delirantes: Completamente convencido'
            ],
            differentialDx: [
                'Trastornos alimentarios - Preocupación limitada a peso/forma corporal',
                'Trastorno obsesivo-compulsivo - Obsesiones no limitadas a apariencia',
                'Tricotilomanía - Arrancarse pelo, sin preocupación por defecto',
                'Trastorno de ansiedad social - Ansiedad por evaluación social, no apariencia específica',
                'Trastorno delirante tipo somático - Creencia de enfermedad vs defecto de apariencia'
            ],
            treatment: [
                'ISRS dosis altas: Fluoxetina 60-80mg/día, Escitalopram 20-30mg/día, Sertralina 200mg/día',
                'TCC específica para TDC: Exposición + prevención de respuesta a rituales',
                'Reestructuración cognitiva de creencias sobre apariencia',
                'Exposición espejo: Descripción no evaluativa de apariencia',
                'Casos con insight ausente: Considerar adición de antipsicótico (Aripiprazol)',
                'Evitar procedimientos cosméticos (típicamente no resuelven preocupación)'
            ],
            prognosis: 'Curso típicamente crónico. 76% reportan ideación suicida lifetime. Responde a tratamiento apropiado',
            prevalence: '2.4% lifetime, igual en hombres y mujeres. Inicio típico: adolescencia (12-13 años)',
            clinicalPearls: [
                'Alta comorbilidad con TOC (32%), depresión mayor (75%), fobia social (39%)',
                'Preguntar específicamente (baja tasa de revelación espontánea)',
                '25-45% buscan cirugía cosmética, típicamente insatisfechos con resultados',
                'Riesgo suicida significativo requiere evaluación regular'
            ]
        },
        '309.81': {
            name: 'Trastorno de estrés postraumático (TEPT)',
            description: 'Síntomas persistentes tras exposición a evento traumático amenazante para la vida',
            criteriaA: [
                'Exposición a muerte real/amenazada, lesión grave o violencia sexual:',
                '• Experiencia directa del evento traumático',
                '• Presenciar evento ocurrido a otros',
                '• Saber que ocurrió a familiar cercano o amigo',
                '• Exposición repetida/extrema a detalles aversivos del trauma (ej. primeros respondedores)',
                'Nota: NO aplica a exposición mediática a menos que sea relacionada con trabajo'
            ],
            criteriaB: [
                'UNO O MÁS síntomas de intrusión (posterior al trauma):',
                '• Recuerdos angustiosos recurrentes, involuntarios e intrusivos',
                '• Sueños angustiosos recurrentes relacionados',
                '• Reacciones disociativas (flashbacks) como si ocurriera nuevamente',
                '• Malestar psicológico intenso ante claves que simbolizan el trauma',
                '• Reacciones fisiológicas marcadas ante claves traumáticas'
            ],
            clinicalFeatures: [
                'Evitación persistente de estímulos asociados (1+ síntoma)',
                'Alteraciones negativas en cognición/estado de ánimo (2+ síntomas)',
                'Alteraciones marcadas en activación y reactividad (2+ síntomas)',
                'Duración de síntomas >1 mes',
                'Malestar significativo o deterioro funcional',
                'No atribuible a sustancias o condición médica'
            ],
            specifiers: [
                'Con síntomas disociativos: Despersonalización o desrealización',
                'Con expresión retardada: Criterios completos no se cumplen hasta ≥6 meses post-evento'
            ],
            differentialDx: [
                'Trastorno de estrés agudo - Duración 3 días a 1 mes post-trauma',
                'Trastorno de adaptación - Respuesta a estresor no traumático',
                'Trastorno de ansiedad - Sin evento traumático precipitante',
                'Trastornos psicóticos - Alucinaciones persistentes vs flashbacks',
                'Trastorno obsesivo-compulsivo - Pensamientos intrusivos no relacionados a trauma'
            ],
            treatment: [
                'Psicoterapia primera línea:',
                '• Terapia de procesamiento cognitivo (CPT) - 12 sesiones',
                '• Terapia de exposición prolongada (PE) - 8-15 sesiones',
                '• EMDR (Eye Movement Desensitization and Reprocessing)',
                'Farmacoterapia: ISRS/IRSN primera línea',
                '• Sertralina 50-200mg/día, Paroxetina 20-60mg/día',
                '• Venlafaxina XR 75-300mg/día',
                'Prazosin 2-15mg/noche para pesadillas',
                'Evitar benzodiacepinas (no efectivas, riesgo de dependencia)'
            ],
            prognosis: '50% recuperación en 3 meses, 50% síntomas crónicos >12 meses. Tratamiento efectivo mejora pronóstico',
            prevalence: '3.5% anual, 8.7% lifetime. Mujeres 2x más que hombres. Mayor en veteranos, víctimas de violencia',
            clinicalPearls: [
                'PCL-5 (PTSD Checklist) para screening y monitoreo',
                'Evaluar riesgo suicida (ideación 6x mayor que población general)',
                'Alta comorbilidad: Depresión (48%), abuso de sustancias (52%)',
                'Trauma complejo (exposiciones múltiples/crónicas) puede requerir tratamiento más prolongado'
            ]
        },
        '308.3': {
            name: 'Trastorno de estrés agudo',
            description: 'Síntomas similares a TEPT que ocurren de 3 días a 1 mes tras exposición a evento traumático',
            criteriaA: [
                'Exposición a muerte real/amenazada, lesión grave o violencia sexual:',
                '• Experiencia directa del evento',
                '• Presenciar evento ocurrido a otros',
                '• Saber que ocurrió a familiar cercano o amigo'
            ],
            criteriaB: [
                'NUEVE O MÁS síntomas de 5 categorías:',
                'INTRUSIÓN: Recuerdos angustiosos, sueños, flashbacks, malestar psicológico, reacciones fisiológicas',
                'ESTADO DE ÁNIMO NEGATIVO: Incapacidad para experimentar emociones positivas',
                'DISOCIACIÓN: Alteración de realidad, incapacidad de recordar aspecto del trauma, despersonalización, desrealización',
                'EVITACIÓN: Esfuerzos para evitar recuerdos angustiosos, recordatorios externos',
                'ACTIVACIÓN: Alteración del sueño, irritabilidad, hipervigilancia, problemas de concentración, respuesta de sobresalto exagerada'
            ],
            clinicalFeatures: [
                'Duración: 3 días a 1 mes tras exposición al trauma',
                'Los síntomas causan malestar significativo o deterioro funcional',
                'No atribuible a sustancias o condición médica',
                'Si persiste >1 mes, considerar cambio diagnóstico a TEPT'
            ],
            specifiers: [
                'Sin especificadores DSM-5 oficiales',
                'Síntomas disociativos son comunes en fase aguda'
            ],
            differentialDx: [
                'TEPT - Duración >1 mes post-trauma',
                'Trastorno de adaptación - Estresor no cumple criterio de traumático',
                'Trastorno de pánico - Ataques de pánico sin exposición traumática',
                'Trastornos disociativos - Síntomas disociativos persistentes sin trauma reciente',
                'Lesión cerebral traumática - Síntomas neurológicos predominan'
            ],
            treatment: [
                'Intervención psicológica temprana:',
                '• Primeros auxilios psicológicos (Psychological First Aid - PFA)',
                '• TCC enfocada en trauma (5-8 sesiones)',
                '• Psicoeducación sobre respuestas normales al trauma',
                '• Técnicas de regulación emocional y relajación',
                'Farmacoterapia típicamente NO recomendada en fase aguda',
                'Prazosin para pesadillas severas si necesario',
                'Evitar benzodiacepinas (pueden interferir con procesamiento del trauma)',
                'Apoyo social y conexión con recursos comunitarios'
            ],
            prognosis: 'Variable. 50% desarrollan TEPT si no reciben tratamiento. Intervención temprana reduce riesgo',
            prevalence: 'Variable según tipo de trauma. 20-50% post-trauma desarrollan síntomas agudos',
            clinicalPearls: [
                'Ventana crítica para intervención preventiva',
                'Síntomas disociativos predicen desarrollo posterior de TEPT',
                'Reevaluación a 1 mes post-trauma para determinar si cumple criterios para TEPT',
                'No todos los expuestos a trauma desarrollan trastorno (resilencia importante)'
            ]
        },
        '313.89': {
            name: 'Trastorno de apego reactivo',
            description: 'Patrón de conducta inhibida y emocionalmente retraída hacia cuidadores adultos en niños',
            criteriaA: [
                'Patrón consistente de conducta inhibida y emocionalmente retraída hacia cuidadores adultos:',
                '• Raramente o mínimamente busca consuelo cuando angustiado',
                '• Raramente o mínimamente responde al consuelo cuando angustiado',
                'Alteración social y emocional persistente caracterizada por ≥2 de:',
                '• Respuesta social y emocional mínima a otros',
                '• Afecto positivo limitado',
                '• Episodios de irritabilidad, tristeza o miedo no explicados durante interacciones no amenazantes'
            ],
            criteriaB: [
                'El niño ha experimentado patrón extremo de cuidado insuficiente evidenciado por ≥1:',
                '• Negligencia o privación social (necesidades emocionales básicas no satisfechas)',
                '• Cambios repetidos de cuidadores primarios (múltiples colocaciones en hogares de acogida)',
                '• Crianza en entornos inusuales (instituciones con alta proporción niño:cuidador)'
            ],
            clinicalFeatures: [
                'Se presume que cuidado del criterio B es responsable de conducta alterada del criterio A',
                'Criterios no cumplidos para trastorno del espectro autista',
                'Alteración aparente antes de edad de 5 años',
                'Edad de desarrollo del niño de al menos 9 meses',
                'Especificar gravedad: Severo cuando todos síntomas presentes en alto grado'
            ],
            specifiers: [
                'Persistente: Síndrome presente >12 meses',
                'Gravedad actual: Severo si todos los síntomas exhibidos en grados elevados'
            ],
            differentialDx: [
                'Trastorno del espectro autista - Déficits pervasivos en comunicación social, patrones repetitivos',
                'Discapacidad intelectual - Déficits acordes con nivel de desarrollo',
                'Trastorno de compromiso social desinhibido - Conducta socialmente desinhibida vs retraída',
                'Trastorno depresivo - Más común en niños mayores, no limitado a cuidadores'
            ],
            treatment: [
                'Establecimiento de relaciones de cuidado estables, seguras y nutritivas',
                'Intervenciones enfocadas en apego:',
                '• Terapia de interacción padre-hijo (PCIT adaptada)',
                '• Attachment and Biobehavioral Catch-up (ABC)',
                '• Child-Parent Psychotherapy (CPP)',
                'Psicoeducación a cuidadores sobre trauma del desarrollo',
                'Servicios de apoyo familiar integral',
                'Tratamiento de trauma si historia de abuso/negligencia severa',
                'Evitar "terapias de apego" no basadas en evidencia (holding therapy, rebirthing)'
            ],
            prognosis: 'Variable. Mejora significativa con colocación estable y cuidado sensible. Sin tratamiento, curso crónico',
            prevalence: 'Raro en población general. Prevalente en niños institucionalizados severamente negligidos',
            clinicalPearls: [
                'Diagnóstico requiere historia documentada de negligencia/privación',
                'Evaluar para trastornos del neurodesarrollo comórbidos',
                'Diferencia clave con autismo: capacidad social emerge con cuidado apropiado',
                'Priorizar estabilidad de colocación y consistencia de cuidadores'
            ]
        },
        '301.83': {
            name: 'Trastorno límite de la personalidad',
            description: 'Patrón de inestabilidad en relaciones, autoimagen y afectos, con impulsividad marcada',
            criteriaA: [
                'Patrón general de inestabilidad (5+ criterios):',
                '1. Esfuerzos frenéticos para evitar abandono real o imaginado',
                '2. Patrón de relaciones intensas e inestables (idealización/devaluación)',
                '3. Alteración de la identidad: autoimagen o sentido de sí mismo inestable',
                '4. Impulsividad en ≥2 áreas dañinas (gastos, sexo, sustancias, conducción, atracones)',
                '5. Comportamiento, intentos o amenazas suicidas recurrentes, o automutilación',
                '6. Inestabilidad afectiva (episodios intensos de disforia, irritabilidad, ansiedad)',
                '7. Sentimientos crónicos de vacío',
                '8. Ira intensa inapropiada o dificultad controlando ira',
                '9. Ideación paranoide transitoria relacionada con estrés o síntomas disociativos severos'
            ],
            criteriaB: [
                'Patrón comienza en adultez temprana',
                'Presente en variedad de contextos',
                'Causa malestar clínicamente significativo o deterioro funcional',
                'No mejor explicado por otro trastorno mental'
            ],
            clinicalFeatures: [
                'Prevalencia de intentos suicidas: 60-70%',
                'Tasa de suicidio completado: 8-10%',
                'Alta comorbilidad con trastornos del estado de ánimo, ansiedad y sustancias',
                'Patrón de crisis frecuentes y uso de servicios de emergencia'
            ],
            specifiers: [
                'Sin especificadores DSM-5 oficiales',
                'Modelo Alternativo DSM-5 Sección III incluye evaluación dimensional'
            ],
            differentialDx: [
                'Trastorno bipolar - Episodios discretos vs inestabilidad crónica reactiva',
                'Trastorno de identidad disociativo - Alteraciones de identidad más marcadas',
                'Trastorno histriónico de la personalidad - Búsqueda de atención vs miedo a abandono',
                'Trastorno narcisista de la personalidad - Autoestima inflada vs inestable',
                'Trastornos de personalidad dependiente y evitativo - Sin impulsividad/ira'
            ],
            treatment: [
                'Psicoterapia primera línea (más efectiva que medicación):',
                '• Terapia Dialéctica Conductual (DBT) - Gold standard',
                '• Terapia Basada en Mentalización (MBT)',
                '• Terapia Centrada en Transferencia (TFP)',
                '• Terapia Centrada en Esquemas',
                'Farmacoterapia para síntomas específicos:',
                '• ISRS para disregulación afectiva: Fluoxetina 20-60mg/día',
                '• Estabilizadores del ánimo para impulsividad: Lamotrigina 100-200mg/día',
                '• Antipsicóticos bajas dosis para síntomas cognitivos: Olanzapina 2.5-10mg/día',
                'Evitar benzodiacepinas (riesgo de abuso, desinhibición)',
                'Planificación de crisis y contratos de seguridad'
            ],
            prognosis: 'Mejora con el tiempo. 85% remisión en 10 años. Impulsividad mejora más que vacío/abandono',
            prevalence: '1.6% población general, 20% pacientes psiquiátricos hospitalizados. Proporción F:M = 3:1',
            clinicalPearls: [
                'Evaluación de riesgo suicida en cada sesión (McLean Screening Instrument útil)',
                'Validación emocional crucial en tratamiento',
                'Límites terapéuticos claros y consistentes',
                'Evitar hospitalización prolongada (puede reforzar comportamiento regresivo)'
            ]
        },
        '301.7': {
            name: 'Trastorno antisocial de la personalidad',
            description: 'Patrón de desprecio y violación de derechos de otros desde los 15 años',
            criteriaA: [
                'Patrón general de desprecio y violación de derechos de otros desde los 15 años (3+ criterios):',
                '1. Fracaso para conformarse a normas sociales respecto a comportamientos legales',
                '2. Engaño (mentiras repetidas, uso de alias, estafar por placer o beneficio)',
                '3. Impulsividad o fracaso para planificar con anticipación',
                '4. Irritabilidad y agresividad (peleas físicas o asaltos repetidos)',
                '5. Temeridad respecto a seguridad propia o de otros',
                '6. Irresponsabilidad consistente (fracaso para mantener trabajo, honrar obligaciones)',
                '7. Ausencia de remordimiento (indiferente o racionalizando haber dañado/maltratado)'
            ],
            criteriaB: [
                'El individuo tiene al menos 18 años',
                'Evidencia de trastorno de conducta con inicio antes de los 15 años',
                'Comportamiento antisocial no ocurre exclusivamente durante esquizofrenia o bipolar',
                'Distinción de psicopatía: TAP más conductual, psicopatía incluye rasgos afectivos'
            ],
            clinicalFeatures: [
                'Alta comorbilidad con trastornos por uso de sustancias (>80%)',
                'Asociado con criminalidad, violencia, problemas legales',
                'Riesgo aumentado de muerte prematura (accidentes, violencia, suicidio)',
                'Dificultad manteniendo empleo y relaciones'
            ],
            specifiers: [
                'Con características psicopáticas (opcional en DSM-5):',
                '• Falta de ansiedad o miedo',
                '• Audacia',
                '• Falta de empatía',
                '• Frialdad emocional'
            ],
            differentialDx: [
                'Trastorno de conducta - Diagnóstico si <18 años',
                'Trastorno narcisista de la personalidad - Grandiosidad vs explotación sin remordimiento',
                'Trastorno límite de la personalidad - Relaciones inestables vs explotadoras',
                'Comportamiento antisocial (no trastorno) - Asociado con contexto socioeconómico adverso',
                'Trastorno por uso de sustancias - Comportamiento antisocial solo durante uso activo'
            ],
            treatment: [
                'Tratamiento desafiante, baja motivación para cambio:',
                '• Programas estructurados basados en comunidad (TC - Therapeutic Communities)',
                '• Terapia cognitiva enfocada en razonamiento moral',
                '• Manejo de contingencias (reforzamiento de comportamientos prosociales)',
                '• Entrevista motivacional',
                'Farmacoterapia para síntomas específicos:',
                '• Estabilizadores del ánimo para impulsividad/agresión (Valproato, Litio)',
                '• ISRS para irritabilidad',
                'Tratamiento de comorbilidades (especialmente uso de sustancias)',
                'Intervención forense/mandato judicial a menudo necesaria'
            ],
            prognosis: 'Variable. Síntomas pueden disminuir después de los 40 años. Alta tasa de recaída criminal',
            prevalence: '0.2-3.3% población general, 70% en ambientes penitenciarios. Proporción M:F = 6:1',
            clinicalPearls: [
                'Hare Psychopathy Checklist-Revised (PCL-R) para evaluación forense',
                'Establecer límites claros y consecuencias',
                'Documentación cuidadosa (mayor riesgo de quejas/demandas)',
                'Precaución con engaño/manipulación en contexto terapéutico'
            ]
        },
        '301.81': {
            name: 'Trastorno narcisista de la personalidad',
            description: 'Patrón de grandiosidad, necesidad de admiración y falta de empatía',
            criteriaA: [
                'Patrón general de grandiosidad, necesidad de admiración y falta de empatía (5+ criterios):',
                '1. Sentido grandioso de autoimportancia (exagera logros/talentos, espera ser reconocido como superior)',
                '2. Preocupación por fantasías de éxito ilimitado, poder, brillantez, belleza o amor ideal',
                '3. Creencia de ser "especial" y único, solo entendido por/debe asociarse con personas especiales',
                '4. Necesidad de admiración excesiva',
                '5. Sentido de privilegio (expectativas de trato favorable o cumplimiento automático)',
                '6. Explotador interpersonalmente (aprovecha de otros para lograr sus fines)',
                '7. Carece de empatía (no dispuesto a reconocer o identificarse con sentimientos de otros)',
                '8. Frecuentemente envidioso de otros o cree que otros le envidian',
                '9. Comportamientos o actitudes arrogantes, altaneros'
            ],
            criteriaB: [
                'Patrón comienza en adultez temprana',
                'Presente en variedad de contextos',
                'Causa malestar o deterioro significativo',
                'Subtipo vulnerable vs grandioso (no oficial en DSM-5)'
            ],
            clinicalFeatures: [
                'Vulnerabilidad subyacente a crítica o fracaso (fragilidad del yo)',
                'Reacciones de ira, vergüenza o humillación ante críticas',
                'Relaciones interpersonales deterioradas',
                'Dificultad en ámbito laboral (conflictos con autoridad)'
            ],
            specifiers: [
                'Sin especificadores DSM-5 oficiales',
                'Clínicamente: Narcisismo grandioso vs vulnerable/encubierto'
            ],
            differentialDx: [
                'Trastorno límite de la personalidad - Autoimagen inestable vs inflada',
                'Trastorno histriónico de la personalidad - Emocionalmente expresivo vs arrogante',
                'Trastorno antisocial de la personalidad - Explotación con vs sin grandiosidad',
                'Trastorno obsesivo-compulsivo de la personalidad - Perfeccionismo vs superioridad',
                'Episodio maníaco - Temporal vs patrón crónico'
            ],
            treatment: [
                'Psicoterapia primera línea:',
                '• Terapia Psicodinámica - Abordar fragilidad subyacente del yo',
                '• Terapia Centrada en Esquemas',
                '• Terapia Metacognitiva Interpersonal (MIT)',
                'Desafíos terapéuticos:',
                '• Baja adherencia (dificultad aceptando necesidad de ayuda)',
                '• Idealización/devaluación del terapeuta',
                '• Resistencia a retroalimentación',
                'Farmacoterapia limitada (no hay medicación específica):',
                '• ISRS para síntomas depresivos comórbidos',
                '• Estabilizadores del ánimo si disregulación emocional marcada',
                'Terapia de grupo puede ser beneficiosa (confrontación por pares)'
            ],
            prognosis: 'Variable. Resistente al tratamiento. Puede mejorar con edad (disminución de grandiosidad)',
            prevalence: '0-6.2% población general, 50-75% hombres. Inicio: adulto joven',
            clinicalPearls: [
                'Narcissistic Personality Inventory (NPI) para evaluación',
                'Buscan tratamiento típicamente por depresión, ansiedad o crisis interpersonal',
                'Alianza terapéutica difícil de establecer y mantener',
                'Evitar confrontación directa (puede resultar en abandono del tratamiento)'
            ]
        },
        '301.82': {
            name: 'Trastorno de la personalidad por evitación',
            description: 'Patrón de inhibición social, sentimientos de inadecuación e hipersensibilidad a evaluación negativa',
            criteriaA: [
                'Patrón general de inhibición social, sentimientos de inadecuación e hipersensibilidad (4+ criterios):',
                '1. Evita actividades ocupacionales con contacto interpersonal significativo (temor a crítica)',
                '2. Reacio a involucrarse con personas a menos que esté seguro de agradar',
                '3. Restricción en relaciones íntimas (temor a vergüenza o ridículo)',
                '4. Preocupado por críticas o rechazo en situaciones sociales',
                '5. Inhibido en situaciones interpersonales nuevas (sentimientos de inadecuación)',
                '6. Se ve socialmente inepto, personalmente poco atractivo o inferior',
                '7. Reacio a tomar riesgos personales o actividades nuevas (podrían resultar embarazosas)'
            ],
            criteriaB: [
                'Patrón comienza en adultez temprana',
                'Presente en variedad de contextos',
                'Causa malestar significativo o deterioro',
                'Diferencia de fobia social: Evitación generalizada de relaciones'
            ],
            clinicalFeatures: [
                'Deseo de relaciones sociales pero evitación por temor',
                'Baja autoestima y autocrítica',
                'Hipersensibilidad al rechazo',
                'Alta comorbilidad con trastorno de ansiedad social (60%)'
            ],
            specifiers: [
                'Sin especificadores DSM-5 oficiales'
            ],
            differentialDx: [
                'Trastorno de ansiedad social - Miedo de actuación vs evitación generalizada de relaciones',
                'Trastorno de personalidad esquizoide - Falta de deseo de relaciones vs temor',
                'Trastorno de personalidad dependiente - Evitación de separación vs rechazo',
                'Agorafobia - Evitación de situaciones específicas vs relaciones',
                'Trastorno de personalidad esquizotípico - Con pensamiento extraño/mágico'
            ],
            treatment: [
                'Psicoterapia primera línea:',
                '• TCC - Reestructuración cognitiva de creencias sobre inadecuación',
                '• Terapia de exposición gradual a situaciones sociales temidas',
                '• Entrenamiento en habilidades sociales',
                '• Terapia de grupo (exposición a situaciones temidas en ambiente seguro)',
                'Farmacoterapia:',
                '• ISRS para síntomas ansiosos/depresivos: Paroxetina 20-50mg/día, Sertralina 50-200mg/día',
                '• Benzodiacepinas ocasionalmente (exposiciones de alto riesgo, corto plazo)',
                'Terapia Centrada en Esquemas para patrones de evitación crónicos',
                'Técnicas de mindfulness y aceptación (ACT)'
            ],
            prognosis: 'Variable. Responde bien a tratamiento. Sin tratamiento, curso típicamente crónico',
            prevalence: '2.4% población general. Igual en hombres y mujeres. Inicio: infancia/adolescencia',
            clinicalPearls: [
                'Distinguir de introversión normal (ausencia de malestar en solitarios)',
                'Alta comorbilidad con depresión mayor (40-50%)',
                'Puede mejorar con relación terapéutica cálida y aceptante',
                'Exposición gradual crucial (no exponer prematuramente a situaciones muy temidas)'
            ]
        },
        // Discapacidades Intelectuales
        '315.00': {
            name: 'Discapacidad intelectual leve',
            description: 'Déficits en funcionamiento intelectual y adaptativo en dominios conceptual, social y práctico. CI 50-70',
            criteriaA: [
                'DOMINIO CONCEPTUAL:',
                '• Preescolares: Puede no haber diferencias manifiestas',
                '• Escolares: Dificultad con lectura, escritura, matemáticas, tiempo, dinero',
                '• Adultos: Pensamiento concreto, dificultad con planificación, estrategia, priorización',
                'DOMINIO SOCIAL:',
                '• Juicio social inmaduro respecto a edad',
                '• Dificultad para percibir claves sociales de pares',
                '• Riesgo de ser manipulado (credulidad)',
                'DOMINIO PRÁCTICO:',
                '• Puede funcionar apropiadamente en cuidado personal',
                '• Necesita apoyo para tareas complejas (compras, transporte, crianza, manejo de dinero)'
            ],
            criteriaB: [
                'CI aproximado: 50-55 a 70',
                'Déficits en razonamiento, resolución de problemas, planificación',
                'Pensamiento abstracto, juicio, aprendizaje académico',
                'Aprendizaje desde experiencia requiere apoyo'
            ],
            clinicalFeatures: [
                'Inicio durante período de desarrollo',
                'Déficits adaptativos limitan funcionamiento en ≥1 actividades de vida diaria',
                'Sin apoyo, déficits limitan funcionamiento en casa, escuela, trabajo, comunidad',
                'Mayoría alcanza independencia total en cuidado personal, actividades domésticas, recreación'
            ],
            specifiers: [
                'Leve: CI 50-70, nivel de apoyo necesario es limitado',
                'Puede vivir independientemente con apoyos mínimos en adultez',
                'Empleo competitivo posible en trabajos que no enfatizan habilidades conceptuales'
            ],
            differentialDx: [
                'Trastorno específico del aprendizaje - Déficits limitados a áreas académicas específicas',
                'Trastorno de la comunicación - Déficits solo en lenguaje',
                'Trastorno del espectro autista - Puede coexistir, evaluar ambos',
                'Discapacidad intelectual moderada/grave - CI más bajo, mayor necesidad de apoyo',
                'Funcionamiento intelectual límite - CI 71-84, no cumple criterios completos'
            ],
            treatment: [
                'Intervención educativa especializada:',
                '• Educación especial individualizada (IEP - Individualized Education Program)',
                '• Enfoque en habilidades funcionales y adaptativas',
                '• Entrenamiento vocacional',
                'Apoyo comunitario:',
                '• Servicios de apoyo familiar',
                '• Programas de vida independiente con supervisión',
                '• Coaching laboral y apoyo en empleo',
                'Terapias complementarias:',
                '• Terapia del habla/lenguaje si déficits comunicativos',
                '• Terapia ocupacional para habilidades de vida diaria',
                'Manejo de comorbilidades psiquiátricas (3-4x más prevalentes)'
            ],
            prognosis: 'Favorable con apoyos apropiados. Mayoría logra vida semi-independiente en adultez',
            prevalence: '1-1.5% población general. Proporción M:F = 1.5:1',
            clinicalPearls: [
                'Evaluar con pruebas estandarizadas de CI (WAIS-IV, Stanford-Binet)',
                'Evaluar funcionamiento adaptativo con escalas (Vineland, ABAS)',
                'Descartar causas genéticas (Síndrome X Frágil, Down)',
                'Alta vulnerabilidad a abuso/explotación requiere protecciones'
            ]
        },
        '315.1': {
            name: 'Discapacidad intelectual moderada',
            description: 'Déficits marcados en funcionamiento conceptual, social y práctico. CI 35-50. Requiere apoyo sustancial',
            criteriaA: [
                'DOMINIO CONCEPTUAL:',
                '• Habilidades conceptuales retrasadas marcadamente respecto a pares',
                '• Habilidades académicas se desarrollan lentamente, limitadas a nivel elemental',
                '• Adultos: Lectura/escritura básica, matemáticas simples con apoyo continuo',
                'DOMINIO SOCIAL:',
                '• Lenguaje y habilidades sociales limitadas comparado con pares',
                '• Relaciones sociales restringidas a familia y amigos cercanos',
                '• Requiere apoyo social sustancial en situaciones nuevas',
                'DOMINIO PRÁCTICO:',
                '• Requiere entrenamiento prolongado para lograr independencia en cuidado personal',
                '• Participación en tareas domésticas con apoyo y recordatorios continuos',
                '• Empleo no calificado con apoyo sustancial'
            ],
            criteriaB: [
                'CI aproximado: 35-40 a 50-55',
                'Progreso lento en todas las áreas de desarrollo',
                'Requiere enseñanza directa y explícita',
                'Aprendizaje nuevo es proceso lento y limitado'
            ],
            clinicalFeatures: [
                'Diferencias de desarrollo evidentes desde edad temprana',
                'Lenguaje típicamente adquirido en edad escolar',
                'Mayoría requiere supervisión y apoyo de por vida',
                'Pueden vivir en hogares grupales con apoyo'
            ],
            specifiers: [
                'Moderado: Apoyo sustancial requerido diariamente',
                'Supervisión necesaria para toma de decisiones complejas',
                'Empleo en ambientes protegidos típicamente'
            ],
            differentialDx: [
                'Discapacidad intelectual leve - CI más alto, menos apoyo necesario',
                'Discapacidad intelectual grave - CI más bajo, apoyo más extenso',
                'Trastorno del espectro autista - Puede coexistir',
                'Parálisis cerebral - Puede coexistir, déficits motores prominentes'
            ],
            treatment: [
                'Educación especial intensiva con metas funcionales',
                'Entrenamiento en habilidades de vida diaria',
                'Programas de día estructurados',
                'Vivienda con apoyo supervisado',
                'Empleo protegido o talleres vocacionales',
                'Terapia conductual para comportamientos desafiantes',
                'Manejo farmacológico de comorbilidades'
            ],
            prognosis: 'Requieren apoyo sustancial de por vida. Pueden lograr vida semi-independiente con apoyos',
            prevalence: '~0.4% población general',
            clinicalPearls: [
                'Evaluación genética recomendada (síndrome de Down más común)',
                'Monitoreo médico regular (mayor riesgo de condiciones comórbidas)',
                'Planificación temprana para transición a adultez crucial',
                'Tutela legal típicamente necesaria en adultez'
            ]
        },
        '315.2': {
            name: 'Discapacidad intelectual grave',
            description: 'Déficits profundos en funcionamiento conceptual, social y práctico. CI 20-35. Requiere apoyo extensivo',
            criteriaA: [
                'DOMINIO CONCEPTUAL:',
                '• Comprensión limitada del lenguaje escrito o conceptos numéricos',
                '• Requiere asistencia para resolver todos los problemas',
                '• Adultos: Apoyo para todas las decisiones',
                'DOMINIO SOCIAL:',
                '• Lenguaje hablado muy limitado (palabras simples, frases)',
                '• Comunicación principalmente sobre aquí y ahora',
                '• Relaciones limitadas a familia y cuidadores muy conocidos',
                'DOMINIO PRÁCTICO:',
                '• Requiere apoyo para todas las actividades de vida diaria',
                '• No puede tomar decisiones responsables sobre bienestar propio o de otros',
                '• Participación limitada en tareas domésticas'
            ],
            criteriaB: [
                'CI aproximado: 20-25 a 35-40',
                'Habilidades conceptuales muy limitadas',
                'Funcionamiento sensoriomotor puede ser deficitario',
                'Requiere enseñanza individualizada constante'
            ],
            clinicalFeatures: [
                'Déficits evidentes desde infancia temprana',
                'Condiciones neurológicas frecuentemente presentes',
                'Alta prevalencia de epilepsia (25%)',
                'Requiere supervisión constante'
            ],
            specifiers: [
                'Grave: Apoyo extensivo necesario para todas las actividades',
                'Supervisión 24/7 típicamente requerida',
                'Vida en instalaciones especializadas común'
            ],
            differentialDx: [
                'Discapacidad intelectual moderada - Funcionamiento más alto',
                'Discapacidad intelectual profunda - CI <20, dependencia total',
                'Trastornos neurológicos progresivos - Pérdida de habilidades'
            ],
            treatment: [
                'Cuidado residencial especializado',
                'Enfoque en habilidades básicas de autocuidado',
                'Terapia física/ocupacional',
                'Dispositivos de comunicación aumentativa',
                'Manejo de comorbilidades médicas',
                'Apoyo familiar intensivo'
            ],
            prognosis: 'Requieren apoyo extensivo de por vida. Énfasis en calidad de vida y dignidad',
            prevalence: '~0.1% población general',
            clinicalPearls: [
                'Evaluación médica exhaustiva para identificar causas',
                'Planificación de cuidados a largo plazo esencial',
                'Evaluación regular de dolor/malestar (comunicación limitada)',
                'Derechos y dignidad deben ser protegidos'
            ]
        },
        // TDAH Subtipos
        '314.00': {
            name: 'TDAH presentación predominantemente inatenta',
            description: 'Cumple criterios de inatención pero no de hiperactividad-impulsividad durante 6+ meses',
            criteriaA: [
                'Seis o más síntomas de INATENCIÓN durante ≥6 meses (5+ si ≥17 años):',
                '• No presta atención suficiente a detalles o comete errores por descuido',
                '• Dificultad para mantener atención en tareas o actividades',
                '• Parece no escuchar cuando se le habla directamente',
                '• No sigue instrucciones y no finaliza tareas',
                '• Dificultad para organizar tareas y actividades',
                '• Evita, le disgusta o es renuente a tareas con esfuerzo mental sostenido',
                '• Extravía objetos necesarios para tareas',
                '• Se distrae fácilmente por estímulos irrelevantes',
                '• Es descuidado en las actividades diarias',
                'Menos de 6 síntomas de hiperactividad-impulsividad'
            ],
            criteriaB: [
                'Varios síntomas presentes antes de los 12 años',
                'Síntomas presentes en 2+ ambientes (casa, escuela, trabajo)',
                'Interfieren con funcionamiento social, académico u ocupacional',
                'No ocurren exclusivamente durante otro trastorno mental'
            ],
            clinicalFeatures: [
                'Más común en niñas que presentación combinada',
                'Puede pasar desapercibido (sin hiperactividad)',
                'Mayor riesgo académico (dificultad para completar tareas)',
                'Comorbilidad frecuente con ansiedad y depresión'
            ],
            specifiers: [
                'Presentación predominantemente inatenta',
                'Leve / Moderado / Grave según número de síntomas y deterioro'
            ],
            differentialDx: [
                'Trastorno específico del aprendizaje - Déficits académicos sin inatención generalizada',
                'Trastornos de ansiedad - Inatención secundaria a preocupaciones',
                'Trastornos del estado de ánimo - Concentración pobre durante episodios',
                'Trastorno del procesamiento auditivo - Dificultad específica con información auditiva'
            ],
            treatment: [
                'Estimulantes: Metilfenidato, anfetaminas (igualmente efectivos)',
                'No estimulantes: Atomoxetina, Guanfacina XR',
                'TCC enfocada en organización y planificación',
                'Acomodaciones académicas (tiempo extra, notas guiadas)',
                'Entrenamiento en funciones ejecutivas',
                'Coaching para habilidades organizacionales'
            ],
            prognosis: 'Variable. Síntomas pueden persistir en adultez, especialmente inatención',
            prevalence: '2-3% niños escolares. Más común en niñas que TDAH combinado',
            clinicalPearls: [
                'Considerar evaluación especialmente en niñas con bajo rendimiento académico',
                'Evaluar síntomas "internos" (ensueño, mente divagando)',
                'Menor respuesta a intervenciones conductuales que tipo combinado',
                'Monitoreo académico cercano importante'
            ]
        },
        // Trastorno del Lenguaje
        '315.39': {
            name: 'Trastorno del lenguaje',
            description: 'Dificultades persistentes en adquisición y uso del lenguaje (hablado, escrito, lenguaje de señas)',
            criteriaA: [
                'Dificultades en adquisición y uso del lenguaje debido a déficits en:',
                '• Vocabulario reducido (conocimiento y uso de palabras)',
                '• Estructura gramatical limitada (capacidad para unir palabras y terminaciones)',
                '• Deterioro del discurso (capacidad para usar vocabulario y conectar oraciones)',
                'Las capacidades de lenguaje están cuantitativa y cualitativamente por debajo de lo esperado para edad'
            ],
            criteriaB: [
                'Dificultades resultan en limitaciones funcionales en:',
                '• Comunicación efectiva',
                '• Participación social',
                '• Logros académicos',
                '• Desempeño ocupacional'
            ],
            clinicalFeatures: [
                'Inicio de síntomas en período de desarrollo temprano',
                'Dificultades no atribuibles a deterioro auditivo u otro sensorial',
                'No explicado mejor por discapacidad intelectual o retraso global',
                'Puede afectar lenguaje expresivo, receptivo o ambos'
            ],
            specifiers: [
                'Sin especificadores DSM-5 oficiales',
                'Clínicamente: Expresivo, receptivo o mixto'
            ],
            differentialDx: [
                'Pérdida auditiva - Descartar con evaluación audiológica',
                'Discapacidad intelectual - Lenguaje acorde con nivel cognitivo',
                'Trastorno del espectro autista - Déficits sociales/comunicativos más amplios',
                'Mutismo selectivo - Habla en algunos contextos',
                'Trastorno pragmático de la comunicación social - Uso social del lenguaje'
            ],
            treatment: [
                'Terapia del habla y lenguaje (SLP):',
                '• Intervención individualizada basada en perfil específico',
                '• Enfoque en vocabulario, gramática, narrativa',
                '• Sesiones 2-3x/semana típicamente',
                'Intervención educativa:',
                '• IEP con servicios de lenguaje',
                '• Acomodaciones en aula',
                '• Tecnología asistiva si apropiado',
                'Intervención familiar:',
                '• Entrenamiento a padres en estrategias de lenguaje',
                '• Enriquecimiento del ambiente lingüístico'
            ],
            prognosis: 'Variable. Intervención temprana mejora resultados. Algunos persisten en adultez',
            prevalence: '5-7% niños en edad escolar. Ligeramente más común en varones',
            clinicalPearls: [
                'Evaluación por SLP certificado esencial para diagnóstico',
                'Considerar evaluación auditiva completa',
                'Alta comorbilidad con trastornos de lectura (50%)',
                'Intervención temprana (antes de 3 años) mejora pronóstico'
            ]
        },
        '315.35': {
            name: 'Trastorno fonológico',
            description: 'Dificultad persistente con producción de sonidos del habla que interfiere con inteligibilidad',
            criteriaA: [
                'Dificultad persistente con producción de sonidos del habla que interfiere con:',
                '• Inteligibilidad del habla',
                '• Comunicación verbal efectiva',
                'Errores incluyen: Omisiones, sustituciones, distorsiones de sonidos',
                'Producción de sonidos está por debajo de edad cronológica'
            ],
            criteriaB: [
                'Dificultades causan limitaciones en:',
                '• Comunicación efectiva',
                '• Participación social',
                '• Logros académicos (especialmente lectura/escritura)',
                '• Desempeño ocupacional'
            ],
            clinicalFeatures: [
                'Inicio en período de desarrollo temprano',
                'No atribuible a condiciones congénitas/adquiridas (paladar hendido, parálisis cerebral)',
                'No explicado por pérdida auditiva',
                'Dificultades no se explican mejor por discapacidad intelectual'
            ],
            specifiers: [
                'Sin especificadores DSM-5 oficiales'
            ],
            differentialDx: [
                'Variaciones normales del habla - Dentro de rango típico para edad/dialecto',
                'Pérdida auditiva - Descartar con evaluación audiológica',
                'Disartria - Debilidad/incoordinación muscular orofacial',
                'Apraxia del habla infantil - Déficit en planificación motora del habla',
                'Trastorno del lenguaje - Puede coexistir'
            ],
            treatment: [
                'Terapia del habla (Articulación):',
                '• Enfoque en sonidos específicos afectados',
                '• Producción aislada → sílabas → palabras → oraciones',
                '• Practica intensiva con retroalimentación',
                'Enfoques basados en evidencia:',
                '• Terapia de articulación tradicional',
                '• Fonología basada en ciclos',
                '• Estimulabilidad y complejidad',
                'Apoyo familiar:',
                '• Práctica en casa con actividades asignadas',
                '• Modelado correcto sin corrección excesiva'
            ],
            prognosis: 'Excelente con intervención. Mayoría resuelve antes de edad escolar con terapia',
            prevalence: '8-9% niños pequeños. Disminuye con edad. Ligeramente más común en varones',
            clinicalPearls: [
                'Evaluación por SLP para identificar patrones de error',
                'Screening auditivo siempre indicado',
                'Distinguir de retraso del habla (resolución con maduración)',
                'Impacto en lectura/escritura requiere monitoreo'
            ]
        },
        // Trastornos Psicóticos Adicionales
        '295.40': {
            name: 'Trastorno esquizofreniforme',
            description: 'Síntomas idénticos a esquizofrenia pero duración de 1-6 meses',
            criteriaA: [
                'Dos o más síntomas (al menos uno debe ser 1-3):',
                '1. Delirios',
                '2. Alucinaciones',
                '3. Lenguaje desorganizado',
                '4. Comportamiento catatónico o desorganizado',
                '5. Síntomas negativos',
                'Duración del episodio: Al menos 1 mes pero menos de 6 meses'
            ],
            criteriaB: [
                'No cumple criterios de duración para esquizofrenia (6 meses)',
                'Se excluye trastorno esquizoafectivo y trastornos del estado de ánimo con psicosis',
                'No atribuible a sustancias o condición médica'
            ],
            clinicalFeatures: [
                'Síntomas similares a esquizofrenia pero más breves',
                'Puede incluir período prodrómico y residual',
                'Mejor pronóstico que esquizofrenia',
                'Un tercio desarrollará esquizofrenia'
            ],
            specifiers: [
                'Con características de buen pronóstico: ≥2 de (inicio síntomas dentro de 4 semanas, confusión/perplejidad, funcionamiento premórbido bueno, ausencia de embotamiento afectivo)',
                'Sin características de buen pronóstico'
            ],
            differentialDx: [
                'Esquizofrenia - Duración ≥6 meses',
                'Trastorno psicótico breve - Duración <1 mes',
                'Trastorno esquizoafectivo - Episodios del estado de ánimo prominentes',
                'Trastorno bipolar/depresivo con psicosis - Psicosis solo durante episodios afectivos'
            ],
            treatment: [
                'Antipsicóticos (igual que esquizofrenia)',
                'Monitoreo cercano para determinar si progresa a esquizofrenia',
                'Apoyo psicosocial',
                'Considerar continuar tratamiento 12-24 meses'
            ],
            prognosis: '33% recuperación completa, 33% desarrollan esquizofrenia, 33% diagnóstico cambia',
            prevalence: '0.2% lifetime. Igual en hombres y mujeres',
            clinicalPearls: [
                'Diagnóstico provisional hasta completar 6 meses de observación',
                'Reevaluar diagnóstico a los 6 meses',
                'Características de buen pronóstico predicen mejor outcome'
            ]
        },
        '298.8': {
            name: 'Trastorno psicótico breve',
            description: 'Presencia de síntomas psicóticos durante al menos 1 día pero menos de 1 mes, con retorno completo a funcionamiento',
            criteriaA: [
                'Presencia de uno o más de los siguientes síntomas (al menos uno debe ser 1-3):',
                '1. Delirios',
                '2. Alucinaciones',
                '3. Lenguaje desorganizado',
                '4. Comportamiento catatónico o gravemente desorganizado',
                'Duración: Al menos 1 día pero menos de 1 mes',
                'Retorno eventual a nivel premórbido de funcionamiento'
            ],
            criteriaB: [
                'No mejor explicado por trastorno depresivo/bipolar con características psicóticas',
                'No atribuible a sustancias o condición médica',
                'No cumple criterios para trastorno esquizofreniforme o esquizofrenia'
            ],
            clinicalFeatures: [
                'Inicio típicamente súbito',
                'Puede ocurrir en respuesta a estrés marcado',
                'Resolución completa típicamente en menos de 1 mes',
                'Riesgo de recurrencia: 50%'
            ],
            specifiers: [
                'Con estresor(es) marcado(s) (psicosis reactiva breve)',
                'Sin estresor(es) marcado(s)',
                'Con inicio posparto (durante embarazo o dentro de 4 semanas postparto)',
                'Con catatonia'
            ],
            differentialDx: [
                'Trastorno esquizofreniforme - Duración 1-6 meses',
                'Esquizofrenia - Duración ≥6 meses',
                'Trastorno del estado de ánimo con características psicóticas - Síntomas afectivos prominentes',
                'Intoxicación/abstinencia de sustancias - Relación temporal con uso',
                'Trastorno facticio - Síntomas intencionales'
            ],
            treatment: [
                'Antipsicóticos de corta duración (Risperidona, Olanzapina)',
                'Benzodiacepinas para agitación aguda',
                'Hospitalización si riesgo de daño',
                'Apoyo psicosocial y reducción de estrés',
                'Discontinuar antipsicóticos después de resolución completa'
            ],
            prognosis: 'Generalmente bueno. 50-80% no desarrollan trastorno crónico',
            prevalence: 'Raro. 0.05% lifetime. Más común en mujeres',
            clinicalPearls: [
                'Evaluar uso de sustancias y condiciones médicas',
                'Considerar contexto cultural (algunas culturas normalizan experiencias tipo psicótico)',
                'Monitoreo a largo plazo para detectar desarrollo de trastorno crónico',
                'Psicosis posparto requiere atención urgente'
            ]
        },
        // Trastornos Bipolares Adicionales
        '296.40': {
            name: 'Trastorno bipolar I, episodio hipomaníaco actual',
            description: 'Historia de al menos un episodio maníaco, actualmente en episodio hipomaníaco',
            criteriaA: [
                'Cumple criterios para episodio hipomaníaco actual',
                'Ha habido al menos un episodio maníaco previo',
                'Los episodios no se explican mejor por otro trastorno'
            ],
            criteriaB: [
                'EPISODIO HIPOMANÍACO (4+ días):',
                '• Estado de ánimo elevado, expansivo o irritable',
                '• Aumento de energía/actividad',
                '• 3+ síntomas: autoestima inflada, menos sueño, verborrea, fuga de ideas, distraibilidad, aumento actividad, actividades riesgosas',
                '• Cambio observable pero NO deterioro severo',
                '• Sin psicosis, no requiere hospitalización'
            ],
            clinicalFeatures: [
                'Diferencia clave con manía: Sin deterioro severo',
                'Funcionamiento puede estar mejorado temporalmente',
                'Requiere historia de episodio maníaco previo para diagnóstico Bipolar I',
                'Monitoreo para prevenir escalada a manía'
            ],
            specifiers: [
                'Con características mixtas, ansiosas, ciclación rápida',
                'Con patrón estacional'
            ],
            differentialDx: [
                'Trastorno bipolar II - Nunca ha tenido episodio maníaco completo',
                'Trastorno ciclotímico - Síntomas menos severos, más crónicos',
                'Hipomanía inducida por sustancias - Relación temporal con uso',
                'Trastorno de personalidad - Patrón crónico vs episódico'
            ],
            treatment: [
                'Continuar estabilizadores del ánimo (Litio, Valproato)',
                'Monitoreo cercano para detectar escalada',
                'Psicoeducación sobre detección temprana de manía',
                'Higiene del sueño estricta',
                'Reducir estimulación excesiva'
            ],
            prognosis: 'Requiere tratamiento de mantenimiento de por vida. Riesgo alto de recurrencia',
            prevalence: 'Parte del curso de Bipolar I (0.6% población)',
            clinicalPearls: [
                'Ventana crítica para intervención preventiva',
                'Evaluar adherencia a medicación',
                'Identificar factores precipitantes (falta de sueño, estrés)',
                'Planificación de crisis anticipada'
            ]
        },
        '296.51': {
            name: 'Trastorno bipolar I, episodio depresivo actual',
            description: 'Historia de al menos un episodio maníaco, actualmente en episodio depresivo mayor',
            criteriaA: [
                'Cumple criterios para episodio depresivo mayor actual',
                'Ha habido al menos un episodio maníaco previo',
                'Los episodios no se explican mejor por trastorno esquizoafectivo'
            ],
            criteriaB: [
                'EPISODIO DEPRESIVO MAYOR (2+ semanas):',
                '• 5+ síntomas incluyendo ánimo deprimido o anhedonia',
                '• Estado de ánimo deprimido, pérdida de interés, cambio de peso, insomnio/hipersomnia',
                '• Agitación/retardo, fatiga, sentimientos de inutilidad, dificultad concentración',
                '• Pensamientos de muerte o suicidio'
            ],
            clinicalFeatures: [
                'Episodios depresivos en Bipolar I típicamente severos',
                'Mayor riesgo suicida que en depresión unipolar',
                'Puede incluir características mixtas (síntomas maníacos subsindromáticos)',
                'Tratamiento de depresión bipolar diferente que unipolar'
            ],
            specifiers: [
                'Con características melancólicas, atípicas, psicóticas, mixtas, ansiosas',
                'Con catatonia, inicio periparto'
            ],
            differentialDx: [
                'Trastorno depresivo mayor - Sin historia de manía',
                'Trastorno bipolar II - Sin historia de episodios maníacos completos',
                'Trastorno esquizoafectivo - Psicosis independiente de episodios afectivos',
                'Depresión inducida por sustancias - Relación temporal'
            ],
            treatment: [
                'Primera línea: Quetiapina 300-600mg/día, Lurasidona 20-120mg/día',
                'Lamotrigina 100-200mg/día (eficaz para prevención)',
                'Litio o Valproato como base',
                'Evitar antidepresivos en monoterapia (riesgo de inducir manía)',
                'Si antidepresivos necesarios: ISRS + estabilizador',
                'TEC para depresión severa resistente al tratamiento'
            ],
            prognosis: 'Variable. Episodios depresivos constituyen mayor parte de la morbilidad en Bipolar I',
            prevalence: 'Parte del curso de Bipolar I. Depresión más frecuente que manía',
            clinicalPearls: [
                'Evaluar riesgo suicida en cada visita (10-15% lifetime)',
                'Buscar características mixtas (peor pronóstico)',
                'Antidepresivos pueden inducir cambio a manía o ciclación rápida',
                'Mantener estabilizador durante tratamiento agudo'
            ]
        },
        '301.13': {
            name: 'Trastorno ciclotímico',
            description: 'Períodos de síntomas hipomaníacos y períodos de síntomas depresivos durante 2+ años',
            criteriaA: [
                'Durante ≥2 años (1 año en niños/adolescentes):',
                '• Numerosos períodos con síntomas hipomaníacos (que no cumplen criterios para episodio hipomaníaco)',
                '• Numerosos períodos con síntomas depresivos (que no cumplen criterios para episodio depresivo mayor)',
                'Durante período de 2 años, síntomas presentes al menos la mitad del tiempo',
                'Nunca sin síntomas >2 meses consecutivos'
            ],
            criteriaB: [
                'Nunca ha cumplido criterios para episodio depresivo mayor, maníaco o hipomaníaco',
                'No mejor explicado por trastorno esquizoafectivo u otro trastorno psicótico',
                'No atribuible a sustancias o condición médica',
                'Los síntomas causan malestar significativo o deterioro'
            ],
            clinicalFeatures: [
                'Inicio típicamente en adolescencia/adulto joven',
                'Curso crónico y fluctuante',
                '15-50% desarrollan trastorno bipolar I o II',
                'Alta comorbilidad con trastornos por uso de sustancias'
            ],
            specifiers: [
                'Con características ansiosas'
            ],
            differentialDx: [
                'Trastorno bipolar I/II - Episodios completos maníacos/hipomaníacos o depresivos',
                'Trastorno del estado de ánimo inducido por sustancias - Relación temporal con uso',
                'Trastorno límite de la personalidad - Inestabilidad afectiva más reactiva',
                'Trastorno depresivo persistente - Sin síntomas hipomaníacos'
            ],
            treatment: [
                'Estabilizadores del ánimo: Litio, Valproato, Lamotrigina',
                'Psicoterapia: TCC, Terapia de ritmos interpersonales y sociales',
                'Psicoeducación sobre reconocimiento de síntomas',
                'Evitar antidepresivos (riesgo de inducir hipomanía)',
                'Regulación de ritmos circadianos',
                'Manejo de comorbilidades'
            ],
            prognosis: 'Curso crónico. Alto riesgo de progresión a Bipolar I/II (15-50%)',
            prevalence: '0.4-1% lifetime. Igual en hombres y mujeres',
            clinicalPearls: [
                'Monitoreo longitudinal para detectar episodios completos',
                'Gráficas de estado de ánimo útiles para rastrear patrones',
                'Alta tasa de búsqueda de tratamiento durante períodos depresivos',
                'Considerar como trastorno del espectro bipolar'
            ]
        },
        // Trastornos Depresivos Adicionales
        '296.31': {
            name: 'Trastorno depresivo mayor, recurrente',
            description: 'Dos o más episodios depresivos mayores con intervalos de al menos 2 meses sin síntomas significativos',
            criteriaA: [
                'Presencia de dos o más episodios depresivos mayores',
                'Intervalo de al menos 2 meses entre episodios sin síntomas depresivos significativos',
                'Nunca ha habido episodio maníaco o hipomaníaco'
            ],
            criteriaB: [
                'Cada episodio cumple criterios para episodio depresivo mayor',
                'Los episodios causan malestar significativo o deterioro funcional',
                'No mejor explicados por trastornos psicóticos',
                'Especificar estado actual del episodio'
            ],
            clinicalFeatures: [
                'Riesgo de recurrencia aumenta con cada episodio',
                'Sin tratamiento de mantenimiento: 50% recurrencia en 2 años, 80% en 5 años',
                'Episodios pueden aumentar en frecuencia y severidad',
                'Mayor resistencia al tratamiento con recurrencias'
            ],
            specifiers: [
                'Episodio actual: Leve, moderado, severo, con características psicóticas',
                'En remisión parcial/completa',
                'Con características melancólicas, atípicas, psicóticas, mixtas, ansiosas',
                'Con catatonia, inicio periparto, patrón estacional'
            ],
            differentialDx: [
                'Trastorno depresivo persistente - Síntomas crónicos menos severos vs episodios discretos',
                'Trastorno bipolar - Descartar historia de hipomanía/manía',
                'Trastorno depresivo inducido por sustancias - Relación temporal',
                'Trastorno de adaptación - Respuesta a estresor, <6 meses'
            ],
            treatment: [
                'Fase aguda (igual que episodio único)',
                'Tratamiento de mantenimiento ESENCIAL:',
                '• Continuar antidepresivo 2+ años después de recuperación',
                '• Después de 3+ episodios: Considerar tratamiento indefinido',
                '• Misma dosis que trató fase aguda',
                'Opciones: ISRS, IRSN, Bupropión, Mirtazapina',
                'Psicoterapia de mantenimiento (TCC, Mindfulness)',
                'Monitoreo regular para detectar recaídas tempranas'
            ],
            prognosis: 'Crónico-recurrente. Tratamiento de mantenimiento reduce recurrencias 70%',
            prevalence: 'Mayoría de depresión mayor es recurrente. 50-85% tienen segundo episodio',
            clinicalPearls: [
                'Después de 3 episodios, riesgo lifetime de recurrencia >90%',
                'Intervalo entre episodios tiende a acortarse',
                'Discontinuación prematura de antidepresivos principal causa de recurrencia',
                'Planificar tratamiento de mantenimiento desde primer episodio si factores de riesgo'
            ]
        },
        '625.4': {
            name: 'Trastorno disfórico premenstrual',
            description: 'Síntomas afectivos marcados en semana premenstrual que mejoran con menstruación',
            criteriaA: [
                'En mayoría de ciclos menstruales, 5+ síntomas en semana final antes de menstruación:',
                'AL MENOS UNO debe ser:',
                '• Labilidad afectiva marcada (cambios de humor)',
                '• Irritabilidad marcada, ira o conflictos interpersonales aumentados',
                '• Estado de ánimo deprimido marcado, desesperanza, autocrítica',
                '• Ansiedad marcada, tensión, nerviosismo',
                'Síntomas adicionales: Disminución de interés, dificultad concentración, letargia, cambio apetito, hipersomnia/insomnio, sentirse abrumada, síntomas físicos'
            ],
            criteriaB: [
                'Los síntomas están asociados con malestar significativo o interferencia',
                'Síntomas no son exacerbación de otro trastorno',
                'Criterios confirmados por evaluaciones prospectivas diarias durante 2+ ciclos',
                'Síntomas mejoran significativamente post-menstruación'
            ],
            clinicalFeatures: [
                'Inicio puede ser en cualquier momento después de menarquia',
                'Empeora al acercarse a menopausia',
                'Cesa con menopausia',
                'Impacto significativo en funcionamiento ocupacional/social'
            ],
            specifiers: [
                'Sin especificadores DSM-5 oficiales'
            ],
            differentialDx: [
                'Síndrome premenstrual (PMS) - Menos severo, menos síntomas afectivos',
                'Trastorno depresivo mayor - No limitado a fase premenstrual',
                'Trastorno bipolar - Patrón no relacionado con ciclo menstrual',
                'Dismenorrea - Dolor sin síntomas afectivos prominentes'
            ],
            treatment: [
                'Primera línea: ISRS (continuo o solo fase luteal):',
                '• Sertralina 50-150mg/día, Fluoxetina 20mg/día',
                '• Puede iniciar solo en fase luteal',
                'Anticonceptivos orales: Drospirenona/etinilestradiol',
                'Agonistas GnRH (casos severos refractarios)',
                'Estilo de vida: Ejercicio, reducción de cafeína/sal',
                'TCC para manejo de síntomas'
            ],
            prognosis: 'Síntomas recurrentes hasta menopausia. Responde bien a tratamiento',
            prevalence: '1.8-5.8% mujeres en edad reproductiva',
            clinicalPearls: [
                'Requiere registro prospectivo diario 2+ ciclos para diagnóstico definitivo',
                'Distinción de PMS por severidad y predominio de síntomas afectivos',
                'ISRS pueden ser efectivos incluso tomados solo en fase luteal',
                'Considerar comorbilidad con depresión/ansiedad'
            ]
        },
        // Trastornos de Ansiedad Adicionales
        '309.21': {
            name: 'Trastorno de ansiedad por separación',
            description: 'Ansiedad excesiva e inapropiada ante separación de figuras de apego',
            criteriaA: [
                'Miedo o ansiedad excesivos e inapropiados respecto a separación de figuras de apego (3+ síntomas):',
                '• Malestar excesivo ante separación',
                '• Preocupación persistente por pérdida o daño a figuras de apego',
                '• Preocupación por eventos que causen separación',
                '• Renuencia o rechazo a salir por miedo a separación',
                '• Miedo a estar solo',
                '• Renuencia a dormir fuera de casa',
                '• Pesadillas con tema de separación',
                '• Quejas somáticas ante separación'
            ],
            criteriaB: [
                'Duración: ≥4 semanas en niños, típicamente ≥6 meses en adultos',
                'Causa malestar significativo o deterioro funcional',
                'No mejor explicado por otro trastorno mental'
            ],
            clinicalFeatures: [
                'Puede ocurrir en niñez o adultez',
                'En adultos: Preocupación excesiva por hijos/cónyuge',
                'Puede manifestarse como "ansiedad escolar"',
                'Alta comorbilidad con otros trastornos de ansiedad'
            ],
            specifiers: [
                'Sin especificadores DSM-5 oficiales'
            ],
            differentialDx: [
                'Trastorno de ansiedad generalizada - Ansiedad no limitada a separación',
                'Trastorno de pánico - Ataques de pánico en múltiples situaciones',
                'Agorafobia - Miedo a situaciones no a separación per se',
                'Trastorno de estrés postraumático - Ansiedad post-trauma',
                'Trastorno del espectro autista - Dificultad con cambios/transiciones'
            ],
            treatment: [
                'Primera línea: TCC (12-16 sesiones):',
                '• Psicoeducación',
                '• Exposición gradual a separaciones',
                '• Reestructuración cognitiva',
                '• Entrenamiento a padres',
                'Farmacoterapia si TCC insuficiente:',
                '• ISRS: Fluoxetina, Sertralina',
                'Terapia familiar para casos en niños'
            ],
            prognosis: 'Variable. Puede remitir espontáneamente o ser curso crónico. Tratamiento efectivo',
            prevalence: '4% niños, 1-2% adultos. Más común en mujeres',
            clinicalPearls: [
                'Evaluar para antecedentes de pérdida o trauma',
                'Puede ser precursor de trastorno de pánico o agorafobia en adultez',
                'Involucrar a familia/pareja en tratamiento crucial',
                'Retorno escolar gradual para niños con evitación escolar'
            ]
        },
        '312.23': {
            name: 'Mutismo selectivo',
            description: 'Fracaso constante para hablar en situaciones sociales específicas donde se espera hablar',
            criteriaA: [
                'Fracaso constante para hablar en situaciones sociales específicas donde se espera',
                'A pesar de hablar en otras situaciones',
                'La alteración interfiere con logros educativos u ocupacionales o comunicación social',
                'Duración: ≥1 mes (no limitado al primer mes de escuela)'
            ],
            criteriaB: [
                'No se debe a falta de conocimiento del idioma',
                'No mejor explicado por trastorno de comunicación',
                'No ocurre exclusivamente durante trastorno del espectro autista, esquizofrenia u otro trastorno psicótico'
            ],
            clinicalFeatures: [
                'Inicio típicamente antes de 5 años',
                'Niño habla normalmente en casa',
                'Puede usar comunicación no verbal (gestos, asentir)',
                'Alta comorbilidad con ansiedad social'
            ],
            specifiers: [
                'Sin especificadores DSM-5 oficiales'
            ],
            differentialDx: [
                'Trastorno del lenguaje - Dificultades con lenguaje en todas situaciones',
                'Trastorno de ansiedad social - Puede hablar pero con ansiedad',
                'Trastorno del espectro autista - Déficits comunicativos más amplios',
                'Timidez normal - Habla después de período de adaptación'
            ],
            treatment: [
                'Primera línea: TCC adaptada:',
                '• Desensibilización gradual',
                '• Reforzamiento positivo del habla',
                '• Técnicas de desvanecimiento de estímulo',
                '• Entrenamiento a maestros y padres',
                'Farmacoterapia (casos resistentes):',
                '• ISRS: Fluoxetina, Sertralina',
                'Evitar atención excesiva al no-habla'
            ],
            prognosis: 'Mejor con intervención temprana. Puede persistir años sin tratamiento',
            prevalence: '0.03-1% en niños. Más común en niñas',
            clinicalPearls: [
                'Evaluar para trastorno de ansiedad social comórbido',
                'Intervención escolar crucial',
                'No forzar habla (puede empeorar ansiedad)',
                'Considerar bilingüismo como factor precipitante'
            ]
        },
        '300.29': {
            name: 'Fobia específica',
            description: 'Miedo o ansiedad marcados ante objeto o situación específica',
            criteriaA: [
                'Miedo o ansiedad marcados ante objeto o situación específica',
                'Objeto/situación fóbica casi siempre provoca miedo o ansiedad inmediatos',
                'Objeto/situación fóbica se evita activamente o se soporta con miedo intenso',
                'Miedo o ansiedad desproporcionados al peligro real',
                'Duración: ≥6 meses'
            ],
            criteriaB: [
                'Causa malestar significativo o deterioro funcional',
                'No mejor explicado por otro trastorno mental'
            ],
            clinicalFeatures: [
                'Típicamente reconoce que miedo es excesivo (excepto niños)',
                'Inicio típicamente en infancia (7-11 años)',
                'Sin tratamiento, curso crónico',
                'Múltiples fobias específicas comunes'
            ],
            specifiers: [
                'Tipo animal (perros, insectos, arañas)',
                'Tipo entorno natural (alturas, tormentas, agua)',
                'Tipo sangre-inyección-herida',
                'Tipo situacional (aviones, ascensores, espacios cerrados)',
                'Otro tipo (atragantamiento, vómito, ruidos fuertes)'
            ],
            differentialDx: [
                'Trastorno de ansiedad social - Miedo a evaluación vs objeto específico',
                'Agorafobia - Múltiples situaciones',
                'Trastorno de estrés postraumático - Miedo relacionado con trauma',
                'TOC - Evitación por obsesiones vs miedo específico',
                'Trastorno de ansiedad por separación - Evitación por separación'
            ],
            treatment: [
                'Primera línea: Exposición (TCC):',
                '• Exposición in vivo gradual',
                '• Exposición en realidad virtual',
                '• Desensibilización sistemática',
                '• 1-5 sesiones pueden ser suficientes',
                'Farmacoterapia raramente necesaria:',
                '• Benzodiacepinas ocasionales (vuelos, procedimientos)',
                '• ISRS si comorbilidad'
            ],
            prognosis: 'Excelente con exposición. 80-90% mejora significativa',
            prevalence: '7-9% anual. Más común en mujeres (2:1)',
            clinicalPearls: [
                'Tipo sangre-inyección: única fobia con respuesta vasovagal (desmayo)',
                'Exposición de una sesión prolongada puede ser efectiva',
                'No confundir con aversiones normales',
                'Evaluar para múltiples fobias'
            ]
        },
        '300.23': {
            name: 'Trastorno de ansiedad social (fobia social)',
            description: 'Miedo marcado a situaciones sociales donde puede ser evaluado negativamente',
            criteriaA: [
                'Miedo o ansiedad marcados ante situaciones sociales donde puede ser examinado',
                'Teme actuar de manera que será evaluado negativamente',
                'Situaciones sociales casi siempre provocan miedo o ansiedad',
                'Situaciones sociales se evitan o soportan con miedo intenso',
                'Miedo o ansiedad desproporcionados',
                'Duración: ≥6 meses'
            ],
            criteriaB: [
                'Causa malestar significativo o deterioro',
                'No atribuible a sustancias o condición médica',
                'No mejor explicado por otro trastorno mental'
            ],
            clinicalFeatures: [
                'Miedo a situaciones de actuación vs interacción (o ambos)',
                'Síntomas somáticos: Rubor, sudoración, temblor, palpitaciones',
                'Inicio típico: adolescencia (13 años)',
                'Sin tratamiento, curso crónico'
            ],
            specifiers: [
                'Solo actuación: Si miedo limitado a hablar o actuar en público'
            ],
            differentialDx: [
                'Trastorno de pánico con agorafobia - Miedo a síntomas de pánico vs evaluación',
                'Trastorno de ansiedad por separación - Ansiedad por separación',
                'Trastorno dismórfico corporal - Preocupación por defecto específico',
                'Trastorno del espectro autista - Déficits en habilidades sociales',
                'Trastorno de personalidad por evitación - Patrón generalizado de evitación'
            ],
            treatment: [
                'Primera línea: TCC (12-16 sesiones):',
                '• Reestructuración cognitiva',
                '• Exposición a situaciones sociales',
                '• Entrenamiento en habilidades sociales',
                'Farmacoterapia:',
                '• ISRS: Sertralina 50-200mg, Paroxetina 20-60mg',
                '• IRSN: Venlafaxina XR 75-225mg',
                '• Beta-bloqueadores (propranolol 10-40mg) para actuación',
                'Terapia de grupo efectiva'
            ],
            prognosis: 'Sin tratamiento, curso crónico. TCC + medicación 50-80% respuesta',
            prevalence: '7% anual, 13% lifetime. Igual en hombres y mujeres',
            clinicalPearls: [
                'Liebowitz Social Anxiety Scale para evaluación',
                'Alta comorbilidad con depresión (50%) y abuso de sustancias',
                'Intervención temprana en adolescencia mejora pronóstico',
                'Solo actuación responde bien a beta-bloqueadores'
            ]
        },
        '300.22': {
            name: 'Agorafobia',
            description: 'Miedo o ansiedad ante 2+ situaciones donde escape sería difícil',
            criteriaA: [
                'Miedo o ansiedad marcados ante 2+ de 5 situaciones:',
                '• Uso de transporte público',
                '• Estar en espacios abiertos',
                '• Estar en lugares cerrados',
                '• Hacer fila o estar en multitud',
                '• Estar fuera de casa solo',
                'Teme situaciones debido a pensamientos de que escape sería difícil o ayuda no disponible',
                'Duración: ≥6 meses'
            ],
            criteriaB: [
                'Situaciones casi siempre provocan miedo o ansiedad',
                'Situaciones se evitan, requieren compañía o se soportan con miedo',
                'Miedo desproporcionado al peligro real',
                'Causa malestar significativo o deterioro'
            ],
            clinicalFeatures: [
                'Puede ocurrir con o sin trastorno de pánico',
                'Evitación puede resultar en confinamiento en casa',
                'Inicio típicamente en adulto joven',
                'Curso crónico sin tratamiento'
            ],
            specifiers: [
                'Sin especificadores DSM-5 oficiales'
            ],
            differentialDx: [
                'Fobia específica - Miedo limitado a situación única',
                'Trastorno de ansiedad social - Miedo a evaluación social',
                'Trastorno de estrés postraumático - Evitación de recordatorios de trauma',
                'Trastorno de ansiedad por separación - Ansiedad por separación vs estar solo',
                'Trastorno depresivo mayor - Evitación por anhedonia, no miedo'
            ],
            treatment: [
                'Primera línea: TCC (12-16 sesiones):',
                '• Exposición gradual in vivo a situaciones evitadas',
                '• Reestructuración cognitiva',
                '• Exposición interoceptiva (si síntomas de pánico)',
                'Farmacoterapia:',
                '• ISRS: Sertralina, Paroxetina, Escitalopram',
                '• IRSN: Venlafaxina',
                '• Benzodiacepinas (uso a corto plazo)',
                'Exposición intensiva puede acelerar mejoría'
            ],
            prognosis: 'Sin tratamiento, curso crónico con fluctuaciones. TCC + medicación efectivos',
            prevalence: '1.7% anual. Más común en mujeres (2:1)',
            clinicalPearls: [
                'Distinguir de trastorno de pánico (puede coexistir)',
                'Agorafobia puede ocurrir sin ataques de pánico',
                'Evitación puede ser sutil (siempre con "persona segura")',
                'Exposición debe ser gradual para prevenir abandono'
            ]
        },
        // Trastornos de Personalidad Adicionales
        '301.0': {
            name: 'Trastorno paranoide de la personalidad',
            description: 'Desconfianza y suspicacia generalizadas que interpreta motivos de otros como malignos',
            criteriaA: [
                'Patrón de desconfianza y suspicacia (4+ criterios):',
                '1. Sospecha que otros le explotan, dañan o engañan (sin base suficiente)',
                '2. Preocupado con dudas sobre lealtad o confiabilidad',
                '3. Renuente a confiar por miedo infundado a que información será usada en su contra',
                '4. Lee significados ocultos degradantes o amenazantes en eventos benignos',
                '5. Guarda rencores persistentemente',
                '6. Percibe ataques a su carácter no aparentes a otros, reacciona rápidamente con ira',
                '7. Sospecha recurrente de infidelidad de pareja (sin justificación)'
            ],
            criteriaB: [
                'No ocurre exclusivamente durante esquizofrenia, trastorno bipolar/depresivo con psicosis',
                'No atribuible a efectos de sustancia o condición médica'
            ],
            clinicalFeatures: [
                'Hipervigilante a amenazas percibidas',
                'Discutidor, quejumbroso',
                'Dificultad relajándose',
                'Frío, distante en relaciones'
            ],
            differentialDx: [
                'Trastorno delirante tipo persecutorio - Ideas delirantes fijas',
                'Esquizofrenia paranoide - Delirios, alucinaciones',
                'Trastorno de personalidad esquizotípica - Pensamiento mágico, excentricidad',
                'Trastorno de personalidad antisocial - Explotación sin paranoia',
                'Trastorno de personalidad límite - Inestabilidad afectiva, relaciones'
            ],
            treatment: [
                'Psicoterapia desafiante (baja confianza):',
                '• Terapia psicodinámica',
                '• TCC (difícil establecer alianza)',
                '• Enfoque en funcionamiento, no en cambiar creencias',
                'Farmacoterapia para síntomas específicos:',
                '• Antipsicóticos bajas dosis si ideas paranoides severas',
                '• ISRS para ansiedad/depresión comórbidas',
                'Evitar confrontación directa de creencias'
            ],
            prognosis: 'Típicamente crónico. Resistente a tratamiento. Puede empeorar con estrés',
            prevalence: '2.3-4.4% población general. Más común en hombres',
            clinicalPearls: [
                'Construir confianza es crucial y toma tiempo',
                'Ser puntual, consistente, directo',
                'Evitar humor (puede malinterpretarse)',
                'Alto riesgo de litigios'
            ]
        },
        '301.20': {
            name: 'Trastorno esquizoide de la personalidad',
            description: 'Patrón de desapego de relaciones sociales y rango restringido de expresión emocional',
            criteriaA: [
                'Patrón de desapego de relaciones (4+ criterios):',
                '1. No desea ni disfruta relaciones cercanas (incluyendo familia)',
                '2. Casi siempre elige actividades solitarias',
                '3. Poco o ningún interés en experiencias sexuales',
                '4. Disfruta de pocas o ninguna actividad',
                '5. Carece de amigos cercanos excepto familiares de primer grado',
                '6. Indiferente a alabanzas o críticas',
                '7. Muestra frialdad emocional, desapego o afectividad aplanada'
            ],
            criteriaB: [
                'No ocurre exclusivamente durante esquizofrenia, trastorno del espectro autista u otro trastorno psicótico',
                'No atribuible a efectos de sustancia o condición médica'
            ],
            clinicalFeatures: [
                'Prefieren estar solos genuinamente',
                'Sin deseo de intimidad',
                'Funcionamiento ocupacional puede estar preservado',
                'Carecen de insight sobre su comportamiento'
            ],
            differentialDx: [
                'Trastorno del espectro autista - Déficits comunicativos, patrones repetitivos',
                'Trastorno esquizotípico - Pensamiento mágico, excentricidad',
                'Trastorno de personalidad por evitación - Desea relaciones pero teme rechazo',
                'Esquizofrenia - Delirios, alucinaciones',
                'Trastorno depresivo - Anhedonia temporal vs patrón de por vida'
            ],
            treatment: [
                'Psicoterapia (rara vez buscan tratamiento):',
                '• TCC enfocada en metas funcionales',
                '• Terapia de grupo (paradójicamente puede ser útil)',
                '• No presionar hacia intimidad',
                'Farmacoterapia raramente indicada:',
                '• Considerar si comorbilidades presentes',
                'Respetar preferencia por soledad'
            ],
            prognosis: 'Estable a lo largo de la vida. Raramente buscan tratamiento',
            prevalence: '3-5% población general. Más común en hombres',
            clinicalPearls: [
                'Distinguir de introversión (introv ertidos disfrutan relaciones selectas)',
                'Funcionan mejor en trabajos solitarios',
                'No sufren por soledad (diferencia clave de evitación)',
                'Rara vez se presentan para tratamiento (traídos por familiares)'
            ]
        },
        '301.22': {
            name: 'Trastorno esquizotípico de la personalidad',
            description: 'Déficits sociales/interpersonales, incomodidad con relaciones, distorsiones cognitivas y excentricidades',
            criteriaA: [
                'Patrón de déficits sociales y distorsiones perceptivas (5+ criterios):',
                '1. Ideas de referencia (excluir delirios)',
                '2. Creencias extrañas o pensamiento mágico influenciando comportamiento',
                '3. Experiencias perceptivas inusuales (ilusiones corporales)',
                '4. Pensamiento y lenguaje extraños (vago, circunstancial, metafórico)',
                '5. Suspicacia o ideación paranoide',
                '6. Afecto inapropiado o restringido',
                '7. Comportamiento o apariencia extraña, excéntrica o peculiar',
                '8. Carece de amigos cercanos excepto familia',
                '9. Ansiedad social excesiva que no disminuye con familiaridad'
            ],
            criteriaB: [
                'No ocurre exclusivamente durante esquizofrenia, trastorno bipolar/depresivo con psicosis u otro trastorno psicótico',
                'Si historia de trastorno del espectro autista, solo diagnosticar si delirios/alucinaciones prominentes'
            ],
            clinicalFeatures: [
                'Puede incluir episodios psicóticos breves',
                'Riesgo aumentado de desarrollar esquizofrenia',
                'Funcionamiento social marcadamente deteriorado',
                'Insight típicamente preservado'
            ],
            differentialDx: [
                'Esquizofrenia - Psicosis más persistente y severa',
                'Trastorno delirante - Delirios fijos sin otras características esquizotípicas',
                'Trastorno de personalidad esquizoide - Sin distorsiones cognitivo-perceptivas',
                'Trastorno de personalidad paranoide - Suspicacia sin excentricidad',
                'Trastorno del espectro autista - Déficits desde desarrollo temprano'
            ],
            treatment: [
                'Psicoterapia:',
                '• TCC adaptada (enfoque en creencias)',
                '• Entrenamiento en habilidades sociales',
                '• Terapia de apoyo',
                'Farmacoterapia:',
                '• Antipsicóticos bajas dosis (Risperidona 0.5-2mg) para síntomas cognitivo-perceptivos',
                '• ISRS para ansiedad comórbida',
                'Evitar sobre-interpretar síntomas como psicosis'
            ],
            prognosis: 'Curso estable. 10% pueden desarrollar esquizofrenia. Funcionamiento limitado',
            prevalence: '0.6-4.6% población general. Ligeramente más común en hombres',
            clinicalPearls: [
                'Considerar como trastorno del espectro esquizofrénico',
                'Monitoreo para desarrollo de psicosis',
                'Antipsicóticos bajas dosis pueden ser útiles (incluso sin psicosis)',
                'Distinguir pensamiento mágico de delirios (insight preservado)'
            ]
        },
        '301.50': {
            name: 'Trastorno histriónico de la personalidad',
            description: 'Patrón de emotividad excesiva y búsqueda de atención',
            criteriaA: [
                'Patrón de emotividad excesiva y búsqueda de atención (5+ criterios):',
                '1. Incómodo en situaciones donde no es centro de atención',
                '2. Interacción con otros frecuentemente caracterizada por comportamiento sexualmente seductor o provocativo inapropiado',
                '3. Muestra cambios rápidos y expresión superficial de emociones',
                '4. Usa apariencia física consistentemente para llamar atención',
                '5. Estilo de habla excesivamente impresionista y carente de detalle',
                '6. Muestra autodramatización, teatralidad, expresión emocional exagerada',
                '7. Es sugestionable (fácilmente influenciado por otros o circunstancias)',
                '8. Considera relaciones más íntimas de lo que son'
            ],
            criteriaB: [
                'Patrón comienza en adultez temprana',
                'Presente en variedad de contextos'
            ],
            clinicalFeatures: [
                'Buscan estimulación y excitación',
                'Puede ser encantador inicialmente',
                'Relaciones superficiales',
                'Baja tolerancia a frustración'
            ],
            differentialDx: [
                'Trastorno límite de la personalidad - Autodestrucción, vacío, abandono',
                'Trastorno narcisista - Grandiosidad vs búsqueda de atención',
                'Trastorno dependiente - Sumisión vs seducción',
                'Trastorno de personalidad antisocial - Explotación sin emotividad excesiva'
            ],
            treatment: [
                'Psicoterapia:',
                '• Psicodinámica',
                '• TCC',
                '• Terapia de grupo',
                'Desafíos terapéuticos:',
                '• Dramatización en sesiones',
                '• Idealización/devaluación rápida',
                'Farmacoterapia para síntomas diana:',
                '• ISRS para disforia',
                '• Estabilizadores si impulsividad'
            ],
            prognosis: 'Variable. Puede mejorar con edad',
            prevalence: '1.8% población general. Más diagnosticado en mujeres',
            clinicalPearls: [
                'Establecer límites claros en terapia',
                'Evitar ser seducido por dramatizaciones',
                'Enfocarse en sentimientos genuinos bajo expresión exagerada',
                'Alta comorbilidad con trastornos somatomorfos'
            ]
        },
        '301.6': {
            name: 'Trastorno dependiente de la personalidad',
            description: 'Necesidad excesiva de que se ocupen de uno que lleva a comportamiento sumiso y adhesivo',
            criteriaA: [
                'Necesidad excesiva de que se ocupen de uno (5+ criterios):',
                '1. Dificultad para tomar decisiones cotidianas sin consejo y reasseguramiento excesivos',
                '2. Necesita que otros asuman responsabilidad por áreas importantes de su vida',
                '3. Dificultad para expresar desacuerdo (por miedo a pérdida de apoyo)',
                '4. Dificultad para iniciar proyectos o hacer cosas por sí mismo',
                '5. Va a extremos para obtener apoyo de otros (voluntario para tareas desagradables)',
                '6. Se siente incómodo o desvalido cuando solo (temor a no poder cuidarse)',
                '7. Busca urgentemente otra relación como fuente de cuidado cuando termina una',
                '8. Preocupado irrealistamente con temor a quedarse solo para cuidarse'
            ],
            criteriaB: [
                'Patrón comienza en adultez temprana',
                'Presente en variedad de contextos'
            ],
            clinicalFeatures: [
                'Pesimista, dubitativo, pasivo',
                'Puede tolerar relaciones abusivas',
                'Riesgo de depresión si pierde relación',
                'Baja autoconfianza'
            ],
            differentialDx: [
                'Trastorno de personalidad por evitación - Evita relaciones vs las busca intensamente',
                'Trastorno límite - Reacciona con ira vs sumisión',
                'Trastorno histriónico - Activamente busca atención vs pasivamente busca cuidado',
                'Agorafobia - Miedo a estar solo en situaciones vs miedo a cuidarse'
            ],
            treatment: [
                'Psicoterapia:',
                '• TCC - Aumento de autonomía, asertividad',
                '• Terapia psicodinámica - Insight sobre dependencia',
                '• Entrenamiento en asertividad',
                '• Toma de decisiones gradual',
                'Farmacoterapia:',
                '• ISRS para ansiedad/depresión comórbidas',
                '• Evitar benzodiacepinas (riesgo de dependencia)',
                'Desafío: Dependencia en terapeuta'
            ],
            prognosis: 'Variable. Puede mejorar con psicoterapia enfocada en autonomía',
            prevalence: '0.5-0.6% población general. Igual en hombres y mujeres',
            clinicalPearls: [
                'Diferenciar de dependencia apropiada en contexto cultural',
                'Graduar aumento de independencia',
                'Trabajar con pareja/familia si mantienen dependencia',
                'Prevenir transferencia dependiente en terapia'
            ]
        },
        '301.4': {
            name: 'Trastorno obsesivo-compulsivo de la personalidad',
            description: 'Preocupación por orden, perfeccionismo y control mental e interpersonal',
            criteriaA: [
                'Patrón de preocupación por orden, perfeccionismo y control (4+ criterios):',
                '1. Preocupado con detalles, reglas, listas, orden, organización o horarios hasta punto de perder objeto principal',
                '2. Perfeccionismo que interfiere con finalización de tareas',
                '3. Excesiva devoción al trabajo y productividad excluyendo ocio y amistades',
                '4. Excesivamente concienzudo, escrupuloso e inflexible sobre moralidad, ética o valores',
                '5. Incapaz de deshacerse de objetos gastados o inútiles',
                '6. Renuente a delegar tareas a menos que se sometan exactamente a su manera',
                '7. Avaro respecto a gastos para sí y otros (dinero como algo que acumular)',
                '8. Muestra rigidez y obstinación'
            ],
            criteriaB: [
                'No ocurre exclusivamente durante TOC',
                'Es patrón de personalidad, no síntomas episódicos'
            ],
            clinicalFeatures: [
                'Formal, serio, reservado',
                'Dificultad expresando emociones',
                'Relaciones interpersonales problemáticas',
                'Puede funcionar bien ocupacionalmente'
            ],
            differentialDx: [
                'Trastorno obsesivo-compulsivo - Obsesiones/compulsiones egodistónicas vs rasgos egosintónicos',
                'Trastorno de acumulación - Específicamente acumulación excesiva',
                'Trastorno narcisista - Cree ser perfecto vs se esfuerza por perfección',
                'Trastorno esquizoide - Desapego emocional sin perfeccionismo'
            ],
            treatment: [
                'Psicoterapia:',
                '• TCC - Flexibilidad cognitiva',
                '• Psicodinámica - Insight sobre control',
                '• Terapia de grupo',
                'Desafíos terapéuticos:',
                '• Intelectualización',
                '• Control en sesiones',
                '• Dificultad con emociones',
                'Farmacoterapia:',
                '• ISRS si síntomas TOC o depresión comórbidos'
            ],
            prognosis: 'Estable a lo largo de la vida. Puede mejorar con edad y terapia',
            prevalence: '2-8% población general. Dos veces más común en hombres',
            clinicalPearls: [
                'Distinguir de TOC (rasgos de personalidad vs síntomas)',
                'Perfeccionismo interfiere con productividad (paradójico)',
                'Pueden funcionar bien en trabajos que requieren atención al detalle',
                'Riesgo de burnout por exceso de trabajo'
            ]
        }
    };

    // Si no hay detalles específicos, usar información genérica pero más completa
    let details = disorderDetails[code];
    if (!details) {
        details = {
            name: name,
            description: 'Información detallada específica no disponible para este código.',
            criteriaA: ['Consulte el manual DSM-5-TR oficial para criterios diagnósticos completos'],
            criteriaB: ['Evaluación clínica integral requerida'],
            clinicalFeatures: ['Considere diagnóstico diferencial cuidadoso'],
            specifiers: [],
            differentialDx: ['Múltiples trastornos pueden presentar síntomas similares'],
            treatment: ['Consulte con especialista para plan de tratamiento individualizado'],
            prognosis: 'Variable según características individuales del paciente',
            prevalence: 'Consulte literatura epidemiológica actual'
        };
    }

    // Crear modal de detalles
    const detailModalId = 'disorderDetailModal';
    let detailModal = document.getElementById(detailModalId);
    
    if (!detailModal) {
        detailModal = document.createElement('div');
        detailModal.id = detailModalId;
        detailModal.className = 'modal fade';
        detailModal.tabIndex = -1;
        detailModal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="disorderDetailModalTitle"></h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="disorderDetailModalBody">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" onclick="copyDSMCodeDetailed('${code}')">
                            <i class="fas fa-copy me-1"></i>
                            Copiar Código
                        </button>
                        <button type="button" class="btn btn-outline-success" onclick="addDSMToFavorites('${code}', '${name.replace(/'/g, "\\'")}')">
                            <i class="fas fa-star me-1"></i>
                            Agregar a Favoritos
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(detailModal);
    }

    // Actualizar contenido del modal de detalles
    document.getElementById('disorderDetailModalTitle').innerHTML = `
        <i class="fas fa-brain me-2"></i>
        ${code} - ${details.name}
    `;
    
    const detailModalBody = document.getElementById('disorderDetailModalBody');
    detailModalBody.innerHTML = `
        <div class="row">
            <div class="col-12">
                <!-- Descripción -->
                <div class="card border-0 bg-light mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-primary">
                            <i class="fas fa-file-medical me-2"></i>
                            Descripción Clínica
                        </h6>
                        <p class="card-text">${details.description}</p>
                    </div>
                </div>
                
                <!-- Criterios Diagnósticos A -->
                <div class="card border-0 bg-light mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-success">
                            <i class="fas fa-clipboard-list me-2"></i>
                            Criterios Diagnósticos - Criterio A
                        </h6>
                        <ul class="list-group list-group-flush">
                            ${details.criteriaA.map(criterion => `
                                <li class="list-group-item bg-transparent border-0 px-0">
                                    <i class="fas fa-check-circle text-success me-2"></i>
                                    ${criterion}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>

                ${details.criteriaB && details.criteriaB.length > 0 ? `
                <div class="card border-0 bg-light mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-info">
                            <i class="fas fa-clipboard-list me-2"></i>
                            Criterios Diagnósticos - Criterio B
                        </h6>
                        <ul class="list-group list-group-flush">
                            ${details.criteriaB.map(criterion => `
                                <li class="list-group-item bg-transparent border-0 px-0">
                                    <i class="fas fa-check-circle text-info me-2"></i>
                                    ${criterion}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
                ` : ''}

                ${details.clinicalFeatures && details.clinicalFeatures.length > 0 ? `
                <div class="card border-0 bg-light mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-secondary">
                            <i class="fas fa-stethoscope me-2"></i>
                            Características Clínicas Adicionales
                        </h6>
                        <ul class="list-group list-group-flush">
                            ${details.clinicalFeatures.map(feature => `
                                <li class="list-group-item bg-transparent border-0 px-0">
                                    <i class="fas fa-chevron-right text-secondary me-2"></i>
                                    ${feature}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
                ` : ''}

                ${details.specifiers && details.specifiers.length > 0 ? `
                <div class="card border-0 bg-light mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-warning">
                            <i class="fas fa-tags me-2"></i>
                            Especificadores
                        </h6>
                        <ul class="list-group list-group-flush">
                            ${details.specifiers.map(specifier => `
                                <li class="list-group-item bg-transparent border-0 px-0">
                                    <i class="fas fa-tag text-warning me-2"></i>
                                    ${specifier}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
                ` : ''}

                ${details.differentialDx && details.differentialDx.length > 0 ? `
                <div class="card border-0 bg-light mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-dark">
                            <i class="fas fa-search-plus me-2"></i>
                            Diagnóstico Diferencial
                        </h6>
                        <ul class="list-group list-group-flush">
                            ${details.differentialDx.map(diff => `
                                <li class="list-group-item bg-transparent border-0 px-0">
                                    <i class="fas fa-microscope text-dark me-2"></i>
                                    ${diff}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
                ` : ''}

                <!-- Tratamiento -->
                <div class="card border-0 bg-light mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-danger">
                            <i class="fas fa-pills me-2"></i>
                            Opciones de Tratamiento
                        </h6>
                        ${Array.isArray(details.treatment) ? `
                            <ul class="list-group list-group-flush">
                                ${details.treatment.map(treatment => `
                                    <li class="list-group-item bg-transparent border-0 px-0">
                                        <i class="fas fa-prescription-bottle text-danger me-2"></i>
                                        ${treatment}
                                    </li>
                                `).join('')}
                            </ul>
                        ` : `<p class="card-text">${details.treatment}</p>`}
                    </div>
                </div>

                ${details.prognosis ? `
                <div class="card border-0 bg-light mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-success">
                            <i class="fas fa-chart-line me-2"></i>
                            Pronóstico
                        </h6>
                        <p class="card-text">${details.prognosis}</p>
                    </div>
                </div>
                ` : ''}

                ${details.prevalence ? `
                <div class="card border-0 bg-light mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-info">
                            <i class="fas fa-chart-pie me-2"></i>
                            Epidemiología y Prevalencia
                        </h6>
                        <p class="card-text">${details.prevalence}</p>
                    </div>
                </div>
                ` : ''}

                ${details.clinicalPearls && details.clinicalPearls.length > 0 ? `
                <div class="card border-0 bg-warning bg-opacity-10 mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-warning">
                            <i class="fas fa-lightbulb me-2"></i>
                            Clinical Pearls - Puntos Clave para el Psiquiatra
                        </h6>
                        <ul class="list-group list-group-flush">
                            ${details.clinicalPearls.map(pearl => `
                                <li class="list-group-item bg-transparent border-0 px-0">
                                    <i class="fas fa-star text-warning me-2"></i>
                                    <strong>${pearl}</strong>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
                ` : ''}

                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Nota Clínica Importante:</strong> Esta información es de referencia educativa basada en DSM-5-TR. 
                    El diagnóstico debe basarse en una evaluación clínica completa, considerando el contexto cultural y la historia del paciente. 
                    Siempre consulte la literatura más reciente y guías de práctica clínica.
                </div>
            </div>
        </div>
    `;

    // Mostrar modal de detalles
    const bootstrapDetailModal = new bootstrap.Modal(detailModal);
    bootstrapDetailModal.show();
}

// Función para copiar código DSM con detalles
function copyDSMCodeDetailed(code) {
    const text = `Código DSM-5: ${code}`;
    navigator.clipboard.writeText(text).then(function() {
        // Mostrar notificación de éxito
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle me-2"></i>
                Código ${code} copiado al portapapeles
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    });
}

/**
 * Abre la ventana de referencias rápidas del DSM-5
 */
function openReferences() {
    // Obtener referencias guardadas del localStorage
    const savedReferences = JSON.parse(localStorage.getItem('dsm5References') || '[]');
    
    // Crear modal con referencias
    const modalHtml = `
        <div class="modal fade" id="referencesModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-bookmark me-2"></i>
                            Referencias Rápidas DSM-5
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${savedReferences.length === 0 ? `
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                No hay referencias guardadas. Puede guardar códigos desde la búsqueda principal haciendo clic en el icono de estrella.
                            </div>
                        ` : `
                            <div class="list-group">
                                ${savedReferences.map(ref => `
                                    <div class="list-group-item list-group-item-action">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 class="mb-1">${ref.code}</h6>
                                                <p class="mb-0 text-muted small">${ref.name || 'Sin descripción'}</p>
                                            </div>
                                            <div>
                                                <button class="btn btn-sm btn-primary me-2" onclick="searchDSMCode('${ref.code}')" data-bs-dismiss="modal">
                                                    <i class="fas fa-search"></i> Ver
                                                </button>
                                                <button class="btn btn-sm btn-danger" onclick="removeReference('${ref.code}')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal" style="height: 38px; border-radius: 4px;">Cerrar</button>
                        ${savedReferences.length > 0 ? `
                            <button type="button" class="btn btn-danger px-4" onclick="clearAllReferences()" style="height: 38px; border-radius: 4px;">
                                <i class="fas fa-trash me-1"></i>Limpiar Todo
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const existingModal = document.getElementById('referencesModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('referencesModal'));
    modal.show();
}

/**
 * Elimina una referencia específica
 */
function removeReference(code) {
    let references = JSON.parse(localStorage.getItem('dsm5References') || '[]');
    references = references.filter(ref => ref.code !== code);
    localStorage.setItem('dsm5References', JSON.stringify(references));
    
    showNotification('Referencia eliminada', 'success');
    
    // Reabrir modal con lista actualizada
    const modal = bootstrap.Modal.getInstance(document.getElementById('referencesModal'));
    if (modal) {
        modal.hide();
    }
    setTimeout(() => openReferences(), 300);
}

/**
 * Limpia todas las referencias guardadas
 */
function clearAllReferences() {
    localStorage.removeItem('dsm5References');
    showNotification('Todas las referencias han sido eliminadas', 'success');
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('referencesModal'));
    if (modal) {
        modal.hide();
    }
}

/**
 * Muestra una notificación temporal en la esquina superior derecha
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de alerta: 'info', 'success', 'error'
 */
function showNotification(message, type = 'info') {
    const alertClass = type === 'success' ? 'alert-success' : type === 'error' ? 'alert-danger' : 'alert-info';
    const iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    const alert = document.createElement('div');
    alert.className = `alert ${alertClass} alert-dismissible fade show`;
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '9999';
    alert.style.minWidth = '300px';
    alert.innerHTML = `
        <i class="fas ${iconClass} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}