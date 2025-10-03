// CIE-10 Functionality - PsiquiApp
// Manejo de códigos CIE-10 para trastornos mentales y del comportamiento

class CIE10Manager {
    constructor() {
        this.currentChapter = '';
        this.searchResults = [];
        this.favorites = JSON.parse(localStorage.getItem('cie10_favorites')) || [];
        this.initializeEventListeners();
        this.loadChapters();
    }

    initializeEventListeners() {
        // Búsqueda en tiempo real
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.performSearch(e.target.value);
            });
        }

        // Filtro por capítulo
        const chapterFilter = document.getElementById('chapterFilter');
        if (chapterFilter) {
            chapterFilter.addEventListener('change', (e) => {
                this.filterByChapter(e.target.value);
            });
        }

        // Event listeners para botones
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('chapter-btn')) {
                this.loadChapterDetails(e.target.dataset.chapter);
            }
            
            if (e.target.classList.contains('condition-btn')) {
                this.showConditionDetails(e.target.dataset.condition);
            }

            if (e.target.classList.contains('favorite-btn')) {
                this.toggleFavorite(e.target.dataset.condition);
            }
        });
    }

    // Base de datos CIE-10 para trastornos mentales (Capítulo V: F00-F99)
    getCIE10Database() {
        return {
            organic: {
                title: "Trastornos Mentales Orgánicos (F00-F09)",
                range: "F00-F09",
                icon: "fas fa-brain",
                color: "danger",
                conditions: [
                    {
                        id: "dementia_alzheimer",
                        code: "F00",
                        name: "Demencia en la Enfermedad de Alzheimer",
                        description: "Síndrome debido a enfermedad del cerebro, crónica y progresiva, con alteración de múltiples funciones corticales superiores.",
                        subcategories: [
                            "F00.0 Demencia en la enfermedad de Alzheimer de inicio precoz",
                            "F00.1 Demencia en la enfermedad de Alzheimer de inicio tardío",
                            "F00.2 Demencia en la enfermedad de Alzheimer, tipo atípico o mixto",
                            "F00.9 Demencia en la enfermedad de Alzheimer, sin especificar"
                        ],
                        symptoms: [
                            "Deterioro de la memoria (inicial para hechos recientes)",
                            "Deterioro del pensamiento y razonamiento",
                            "Reducción del flujo de ideas",
                            "Deterioro en el procesamiento de información",
                            "Cambios en el comportamiento y personalidad"
                        ],
                        prevalence: "60-70% de todos los casos de demencia",
                        notes: "Inicio insidioso con deterioro lento pero continuo"
                    },
                    {
                        id: "delirium",
                        code: "F05",
                        name: "Delirium no Inducido por Alcohol u Otras Sustancias Psicoactivas",
                        description: "Síndrome cerebral orgánico caracterizado por alteración simultánea de la conciencia, atención, percepción, pensamiento, memoria, comportamiento psicomotor, emoción y ciclo sueño-vigilia.",
                        subcategories: [
                            "F05.0 Delirium no superpuesto a demencia",
                            "F05.1 Delirium superpuesto a demencia",
                            "F05.8 Otro delirium",
                            "F05.9 Delirium sin especificar"
                        ],
                        symptoms: [
                            "Reducción de la claridad de conciencia del entorno",
                            "Deterioro de la capacidad de dirigir, focalizar, sostener y desplazar la atención",
                            "Alteración cognitiva (déficit de memoria, desorientación, alteración del lenguaje)",
                            "Inicio agudo y curso fluctuante"
                        ],
                        prevalence: "10-30% en pacientes hospitalizados",
                        notes: "Requiere identificación y tratamiento de la causa subyacente"
                    }
                ]
            },
            substance: {
                title: "Trastornos por Uso de Sustancias (F10-F19)",
                range: "F10-F19",
                icon: "fas fa-pills",
                color: "warning",
                conditions: [
                    {
                        id: "alcohol_dependence",
                        code: "F10.2",
                        name: "Síndrome de Dependencia del Alcohol",
                        description: "Conjunto de fenómenos fisiológicos, comportamentales y cognitivos en los cuales el uso del alcohol adquiere la máxima prioridad.",
                        subcategories: [
                            "F10.20 Síndrome de dependencia del alcohol, actualmente abstinente",
                            "F10.21 Síndrome de dependencia del alcohol, actualmente abstinente, pero en entorno protegido",
                            "F10.22 Síndrome de dependencia del alcohol, actualmente bajo régimen de mantenimiento clínico supervisado",
                            "F10.23 Síndrome de dependencia del alcohol, actualmente abstinente, pero recibiendo tratamiento con medicamentos aversivos o bloqueantes",
                            "F10.24 Síndrome de dependencia del alcohol, uso actual de la sustancia",
                            "F10.25 Síndrome de dependencia del alcohol, uso continuo",
                            "F10.26 Síndrome de dependencia del alcohol, uso episódico"
                        ],
                        symptoms: [
                            "Deseo intenso de consumir alcohol",
                            "Dificultades para controlar el consumo",
                            "Síntomas de abstinencia al reducir o cesar el consumo",
                            "Tolerancia (necesidad de mayores cantidades)",
                            "Abandono progresivo de otras fuentes de placer",
                            "Persistencia del consumo a pesar de consecuencias dañinas"
                        ],
                        prevalence: "5-10% de la población adulta",
                        notes: "Diagnóstico requiere al menos 3 criterios presentes en el último año"
                    },
                    {
                        id: "opioid_dependence",
                        code: "F11.2",
                        name: "Síndrome de Dependencia de Opiáceos",
                        description: "Dependencia de opiáceos naturales, sintéticos o semi-sintéticos.",
                        subcategories: [
                            "F11.20 Actualmente abstinente",
                            "F11.21 Actualmente abstinente, en entorno protegido",
                            "F11.22 Bajo régimen de mantenimiento clínico",
                            "F11.24 Uso actual de la sustancia",
                            "F11.25 Uso continuo",
                            "F11.26 Uso episódico"
                        ],
                        symptoms: [
                            "Compulsión a consumir opiáceos",
                            "Tolerancia marcada",
                            "Síndrome de abstinencia severo",
                            "Uso continuado a pesar de consecuencias",
                            "Abandono de actividades importantes",
                            "Tiempo excesivo dedicado a obtener la sustancia"
                        ],
                        prevalence: "0.7% de la población adulta",
                        notes: "Alto riesgo de sobredosis y transmisión de enfermedades"
                    }
                ]
            },
            psychotic: {
                title: "Esquizofrenia y Trastornos Psicóticos (F20-F29)",
                range: "F20-F29",
                icon: "fas fa-eye",
                color: "primary",
                conditions: [
                    {
                        id: "schizophrenia",
                        code: "F20",
                        name: "Esquizofrenia",
                        description: "Trastorno psicótico caracterizado por distorsiones fundamentales y típicas de la percepción, del pensamiento y de las emociones.",
                        subcategories: [
                            "F20.0 Esquizofrenia paranoide",
                            "F20.1 Esquizofrenia hebefrénica",
                            "F20.2 Esquizofrenia catatónica",
                            "F20.3 Esquizofrenia indiferenciada",
                            "F20.4 Depresión post-esquizofrénica",
                            "F20.5 Esquizofrenia residual",
                            "F20.6 Esquizofrenia simple",
                            "F20.8 Otra esquizofrenia",
                            "F20.9 Esquizofrenia sin especificar"
                        ],
                        symptoms: [
                            "Ideas delirantes",
                            "Alucinaciones (especialmente auditivas)",
                            "Lenguaje desorganizado",
                            "Comportamiento catatónico o gravemente desorganizado",
                            "Síntomas negativos (aplanamiento afectivo, alogia, abulia)"
                        ],
                        prevalence: "0.3-0.7% de la población",
                        notes: "Duración mínima de 6 meses para el diagnóstico"
                    },
                    {
                        id: "brief_psychotic",
                        code: "F23",
                        name: "Trastornos Psicóticos Agudos y Transitorios",
                        description: "Trastornos psicóticos con inicio agudo (dentro de 2 semanas) y duración generalmente breve.",
                        subcategories: [
                            "F23.0 Trastorno psicótico agudo polimorfo sin síntomas de esquizofrenia",
                            "F23.1 Trastorno psicótico agudo polimorfo con síntomas de esquizofrenia",
                            "F23.2 Trastorno psicótico agudo de tipo esquizofrénico",
                            "F23.3 Otro trastorno psicótico agudo con predominio de ideas delirantes",
                            "F23.8 Otros trastornos psicóticos agudos y transitorios",
                            "F23.9 Trastorno psicótico agudo y transitorio sin especificar"
                        ],
                        symptoms: [
                            "Inicio agudo (horas a días)",
                            "Síntomas psicóticos variables",
                            "Posible confusión emocional",
                            "Recuperación completa típica en pocos meses"
                        ],
                        prevalence: "0.05% incidencia anual",
                        notes: "Buen pronóstico con tratamiento adecuado"
                    }
                ]
            },
            mood: {
                title: "Trastornos del Humor (F30-F39)",
                range: "F30-F39",
                icon: "fas fa-chart-line",
                color: "info",
                conditions: [
                    {
                        id: "manic_episode",
                        code: "F30",
                        name: "Episodio Maníaco",
                        description: "Período definido de estado de ánimo anormalmente elevado, expansivo o irritable.",
                        subcategories: [
                            "F30.0 Hipomanía",
                            "F30.1 Manía sin síntomas psicóticos",
                            "F30.2 Manía con síntomas psicóticos",
                            "F30.8 Otros episodios maníacos",
                            "F30.9 Episodio maníaco sin especificar"
                        ],
                        symptoms: [
                            "Estado de ánimo elevado o irritable",
                            "Aumento de la actividad o energía",
                            "Autoestima exagerada o grandiosidad",
                            "Disminución de la necesidad de dormir",
                            "Más hablador de lo usual",
                            "Fuga de ideas o pensamientos acelerados",
                            "Distractibilidad",
                            "Actividades de alto riesgo"
                        ],
                        prevalence: "1-2% de la población",
                        notes: "Duración mínima de 1 semana o cualquier duración si requiere hospitalización"
                    },
                    {
                        id: "depressive_episode",
                        code: "F32",
                        name: "Episodios Depresivos",
                        description: "Período de al menos 2 semanas de estado de ánimo deprimido o pérdida de interés.",
                        subcategories: [
                            "F32.0 Episodio depresivo leve",
                            "F32.1 Episodio depresivo moderado",
                            "F32.2 Episodio depresivo grave sin síntomas psicóticos",
                            "F32.3 Episodio depresivo grave con síntomas psicóticos",
                            "F32.8 Otros episodios depresivos",
                            "F32.9 Episodio depresivo sin especificar"
                        ],
                        symptoms: [
                            "Estado de ánimo deprimido",
                            "Pérdida de interés o capacidad de disfrutar",
                            "Fatigabilidad aumentada",
                            "Pérdida de confianza en sí mismo",
                            "Sentimientos de culpa",
                            "Pensamientos de muerte o suicidio",
                            "Disminución de la concentración",
                            "Alteraciones del sueño",
                            "Cambios en el apetito"
                        ],
                        prevalence: "5-10% prevalencia anual",
                        notes: "Clasificación por gravedad según número e intensidad de síntomas"
                    }
                ]
            },
            anxiety: {
                title: "Trastornos Neuróticos, Relacionados con Estrés (F40-F48)",
                range: "F40-F48",
                icon: "fas fa-heartbeat",
                color: "warning",
                conditions: [
                    {
                        id: "phobic_disorders",
                        code: "F40",
                        name: "Trastornos de Ansiedad Fóbica",
                        description: "Grupo de trastornos en los que la ansiedad se desencadena específica y predeciblemente por situaciones u objetos.",
                        subcategories: [
                            "F40.0 Agorafobia",
                            "F40.1 Fobias sociales",
                            "F40.2 Fobias específicas (aisladas)",
                            "F40.8 Otros trastornos de ansiedad fóbica",
                            "F40.9 Trastorno de ansiedad fóbica sin especificar"
                        ],
                        symptoms: [
                            "Ansiedad desencadenada por situaciones específicas",
                            "Evitación de situaciones fóbicas",
                            "Síntomas autonómicos (palpitaciones, sudoración)",
                            "Reconocimiento de que el miedo es excesivo",
                            "Deterioro significativo del funcionamiento"
                        ],
                        prevalence: "7-9% de la población",
                        notes: "La evitación es característica central del trastorno"
                    },
                    {
                        id: "ptsd",
                        code: "F43.1",
                        name: "Trastorno de Estrés Postraumático",
                        description: "Respuesta tardía o diferida a un evento o situación estresante de naturaleza amenazante o catastrófica.",
                        subcategories: [
                            "Síntomas de re-experimentación",
                            "Síntomas de evitación",
                            "Síntomas de hiperactivación",
                            "Alteraciones negativas en cognición y estado de ánimo"
                        ],
                        symptoms: [
                            "Re-experimentación del trauma (flashbacks, pesadillas)",
                            "Evitación de estímulos relacionados con el trauma",
                            "Embotamiento de la capacidad de respuesta general",
                            "Síntomas persistentes de hiperactivación",
                            "Malestar significativo o deterioro funcional"
                        ],
                        prevalence: "3-4% de la población general",
                        notes: "Desarrollo típico dentro de 6 meses del evento traumático"
                    }
                ]
            }
        };
    }

    // Obtener conteo real de códigos por categoría desde chapterData en showChapter()
    getChapterCodeCount(chapterKey) {
        // Mapeo de claves de getCIE10Database() a rangos de capítulos
        const chapterMapping = {
            'organic': 'F00-F09',
            'substance': 'F10-F19',
            'psychotic': 'F20-F29',
            'mood': 'F30-F39',
            'anxiety': 'F40-F48',
            'personality': 'F60-F69'
        };

        // Conteos reales de códigos por capítulo (desde showChapter chapterData)
        const chapterCounts = {
            'F00-F09': 9,
            'F10-F19': 10,
            'F20-F29': 13,
            'F30-F39': 13,
            'F40-F48': 15,
            'F60-F69': 19
        };

        const chapterRange = chapterMapping[chapterKey];
        return chapterCounts[chapterRange] || 0;
    }

    loadChapters() {
        const database = this.getCIE10Database();
        const chaptersContainer = document.getElementById('chaptersContainer');
        
        if (!chaptersContainer) return;
        
        // Limpiar input de búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Limpiar resultados anteriores y mostrar capítulos
        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
        }
        chaptersContainer.style.display = 'flex';

        // Mapeo de claves internas a rangos de capítulos
        const chapterRangeMap = {
            'organic': 'F00-F09',
            'substance': 'F10-F19',
            'psychotic': 'F20-F29',
            'mood': 'F30-F39',
            'anxiety': 'F40-F48',
            'personality': 'F60-F69'
        };

        chaptersContainer.innerHTML = Object.keys(database).map(chapterKey => {
            const chapter = database[chapterKey];
            const realCount = this.getChapterCodeCount(chapterKey);
            const chapterRange = chapterRangeMap[chapterKey];
            return `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 shadow-sm border-0 hover-card">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <div class="icon-circle bg-${chapter.color}-subtle me-3">
                                    <i class="${chapter.icon} text-${chapter.color}"></i>
                                </div>
                                <div>
                                    <h6 class="card-title mb-0">${chapter.range}</h6>
                                    <small class="text-muted">${chapter.title}</small>
                                </div>
                            </div>
                            <p class="card-text small mb-3">
                                ${chapter.conditions[0]?.description || 'Códigos diagnósticos'}
                            </p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="badge bg-${chapter.color}-subtle text-${chapter.color}">${realCount} ${realCount === 1 ? 'código' : 'códigos'}</span>
                                <button class="btn btn-sm btn-outline-${chapter.color}" onclick="showChapter('${chapterRange}')">
                                    Ver códigos
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    loadChapterDetails(chapterKey) {
        const database = this.getCIE10Database();
        const chapter = database[chapterKey];
        
        if (!chapter) return;

        let resultsContainer = document.getElementById('resultsContainer');
        
        // Crear contenedor de resultados si no existe
        if (!resultsContainer) {
            const chaptersContainer = document.getElementById('chaptersContainer');
            if (!chaptersContainer) return;
            
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'resultsContainer';
            resultsContainer.className = 'row mb-4';
            chaptersContainer.parentNode.insertBefore(resultsContainer, chaptersContainer);
        }
        
        // Ocultar chaptersContainer y mostrar resultsContainer
        const chaptersContainer = document.getElementById('chaptersContainer');
        if (chaptersContainer) {
            chaptersContainer.style.display = 'none';
        }
        resultsContainer.style.display = 'flex';

        resultsContainer.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h4 class="text-${chapter.color}">
                            <i class="${chapter.icon} me-2"></i>
                            ${chapter.title}
                            <small class="text-muted">${chapter.range}</small>
                        </h4>
                        <button class="btn btn-outline-secondary" onclick="cie10Manager.loadChapters()">
                            <i class="fas fa-arrow-left me-1"></i>
                            Volver a Capítulos
                        </button>
                    </div>
                </div>
            </div>
            <div class="row">
                ${chapter.conditions.map(condition => `
                    <div class="col-12 mb-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div class="flex-grow-1">
                                        <h6 class="card-title text-${chapter.color} mb-1">
                                            ${condition.code}
                                        </h6>
                                        <h5 class="mb-2">${condition.name}</h5>
                                        <p class="card-text text-muted mb-3">${condition.description}</p>
                                        <div class="mb-2">
                                            <small class="text-muted">
                                                <i class="fas fa-chart-bar me-1"></i>
                                                Prevalencia: ${condition.prevalence}
                                            </small>
                                        </div>
                                        <div class="d-flex gap-2">
                                            <button class="btn btn-${chapter.color} btn-sm condition-btn" 
                                                    data-condition="${condition.id}">
                                                <i class="fas fa-info-circle me-1"></i>
                                                Ver Detalles
                                            </button>
                                            <button class="btn btn-outline-warning btn-sm favorite-btn ${this.favorites.includes(condition.id) ? 'active' : ''}" 
                                                    data-condition="${condition.id}">
                                                <i class="fas fa-star me-1"></i>
                                                ${this.favorites.includes(condition.id) ? 'Guardado' : 'Guardar'}
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

    showConditionDetails(conditionId) {
        const database = this.getCIE10Database();
        let condition = null;
        let chapterKey = null;

        // Buscar la condición en todos los capítulos
        for (const [key, chapter] of Object.entries(database)) {
            const found = chapter.conditions.find(c => c.id === conditionId);
            if (found) {
                condition = found;
                chapterKey = key;
                break;
            }
        }

        if (!condition) return;

        const modalBody = document.getElementById('conditionModalBody');
        const modalTitle = document.getElementById('conditionModalTitle');
        
        if (modalTitle) {
            modalTitle.innerHTML = `
                <i class="${database[chapterKey].icon} me-2"></i>
                ${condition.name}
            `;
        }

        if (modalBody) {
            modalBody.innerHTML = `
                <div class="mb-4">
                    <h6 class="text-primary">Código CIE-10</h6>
                    <p class="fw-bold fs-5">${condition.code}</p>
                </div>

                <div class="mb-4">
                    <h6 class="text-primary">Descripción</h6>
                    <p>${condition.description}</p>
                </div>

                <div class="mb-4">
                    <h6 class="text-primary">Subcategorías</h6>
                    <ul class="list-group list-group-flush">
                        ${condition.subcategories.map(subcategory => `
                            <li class="list-group-item border-0 px-0">
                                <i class="fas fa-angle-right text-primary me-2"></i>
                                ${subcategory}
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <div class="mb-4">
                    <h6 class="text-primary">Manifestaciones Clínicas</h6>
                    <ul class="list-group list-group-flush">
                        ${condition.symptoms.map(symptom => `
                            <li class="list-group-item border-0 px-0">
                                <i class="fas fa-stethoscope text-success me-2"></i>
                                ${symptom}
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <div class="mb-4">
                    <h6 class="text-primary">Epidemiología</h6>
                    <p><i class="fas fa-chart-bar me-2"></i>${condition.prevalence}</p>
                </div>

                <div class="mb-4">
                    <h6 class="text-primary">Notas Clínicas</h6>
                    <p><i class="fas fa-notes-medical me-2"></i>${condition.notes}</p>
                </div>

                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Importante:</strong> Los códigos CIE-10 deben utilizarse según las directrices oficiales de codificación. 
                    Esta información es para referencia profesional únicamente.
                </div>
            `;
        }

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('conditionModal'));
        modal.show();
    }

    performSearch(query) {
        const resultsContainer = document.getElementById('resultsContainer');
        const chaptersContainer = document.getElementById('chaptersContainer');
        
        // Si la búsqueda está vacía o es muy corta, limpiar resultados y mostrar capítulos
        if (query.length < 2) {
            if (resultsContainer) {
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
            }
            if (chaptersContainer) {
                chaptersContainer.style.display = 'flex';
            }
            return;
        }

        const database = this.getCIE10Database();
        const results = [];

        Object.keys(database).forEach(chapterKey => {
            const chapter = database[chapterKey];
            chapter.conditions.forEach(condition => {
                if (
                    condition.name.toLowerCase().includes(query.toLowerCase()) ||
                    condition.code.toLowerCase().includes(query.toLowerCase()) ||
                    condition.description.toLowerCase().includes(query.toLowerCase()) ||
                    condition.subcategories.some(sub => sub.toLowerCase().includes(query.toLowerCase()))
                ) {
                    results.push({
                        ...condition,
                        chapter: chapter,
                        chapterKey: chapterKey
                    });
                }
            });
        });

        this.displaySearchResults(results, query);
    }

    displaySearchResults(results, query) {
        let resultsContainer = document.getElementById('resultsContainer');
        const chaptersContainer = document.getElementById('chaptersContainer');
        
        if (!chaptersContainer) return;
        
        // Crear contenedor de resultados si no existe
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'resultsContainer';
            resultsContainer.className = 'row mb-4';
            chaptersContainer.parentNode.insertBefore(resultsContainer, chaptersContainer);
        }
        
        // Asegurar visibilidad del contenedor de resultados
        resultsContainer.style.display = 'flex';
        chaptersContainer.style.display = 'none';

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning border-0 shadow-sm" role="alert" id="searchErrorAlert">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-exclamation-triangle fa-2x text-warning me-3"></i>
                            <div>
                                <h5 class="alert-heading mb-1">
                                    <i class="fas fa-search me-2"></i>
                                    Código CIE-10 No Encontrado
                                </h5>
                                <p class="mb-0">No se encontraron diagnósticos que coincidan con: <strong>"${query}"</strong></p>
                            </div>
                        </div>
                        <hr>
                        <div class="mb-0">
                            <p class="mb-2"><strong>Sugerencias:</strong></p>
                            <ul class="mb-3">
                                <li>Verifique que el código CIE-10 esté escrito correctamente (ej: F32.0, F41.1)</li>
                                <li>Intente buscar por el nombre de la enfermedad o condición</li>
                                <li>Use palabras clave relacionadas con los síntomas</li>
                                <li>Explore los capítulos para encontrar códigos similares</li>
                            </ul>
                            <button class="btn btn-primary" onclick="cie10Manager.loadChapters()">
                                <i class="fas fa-book-medical me-2"></i>
                                Ver Todos los Capítulos
                            </button>
                            <button class="btn btn-outline-secondary ms-2" onclick="document.getElementById('searchInput').value=''; cie10Manager.loadChapters()">
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
                        <button class="btn btn-outline-secondary" onclick="cie10Manager.loadChapters()">
                            <i class="fas fa-times me-1"></i>
                            Limpiar Búsqueda
                        </button>
                    </div>
                </div>
            </div>
            <div class="row">
                ${results.map(condition => `
                    <div class="col-12 mb-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div class="flex-grow-1">
                                        <div class="d-flex align-items-center mb-2">
                                            <span class="badge bg-${condition.chapter.color} me-2">
                                                <i class="${condition.chapter.icon} me-1"></i>
                                                ${condition.chapter.range}
                                            </span>
                                            <small class="text-muted">${condition.chapter.title}</small>
                                        </div>
                                        <h6 class="text-${condition.chapter.color} mb-1">${condition.code}</h6>
                                        <h5 class="mb-2">${condition.name}</h5>
                                        <p class="card-text text-muted mb-3">${condition.description}</p>
                                        <div class="d-flex gap-2">
                                            <button class="btn btn-${condition.chapter.color} btn-sm condition-btn" 
                                                    data-condition="${condition.id}">
                                                <i class="fas fa-info-circle me-1"></i>
                                                Ver Detalles
                                            </button>
                                            <button class="btn btn-outline-warning btn-sm favorite-btn ${this.favorites.includes(condition.id) ? 'active' : ''}" 
                                                    data-condition="${condition.id}">
                                                <i class="fas fa-star me-1"></i>
                                                ${this.favorites.includes(condition.id) ? 'Guardado' : 'Guardar'}
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

    filterByChapter(chapterKey) {
        if (!chapterKey) {
            this.loadChapters();
            return;
        }
        this.loadChapterDetails(chapterKey);
    }

    toggleFavorite(conditionId) {
        const index = this.favorites.indexOf(conditionId);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(conditionId);
        }
        
        localStorage.setItem('cie10_favorites', JSON.stringify(this.favorites));
        
        // Actualizar botón
        const button = document.querySelector(`[data-condition="${conditionId}"].favorite-btn`);
        if (button) {
            if (this.favorites.includes(conditionId)) {
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
            const resultsContainer = document.getElementById('resultsContainer');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="col-12">
                        <div class="text-center py-5">
                            <i class="fas fa-star text-muted" style="font-size: 3rem;"></i>
                            <h5 class="mt-3 text-muted">No tienes favoritos guardados</h5>
                            <p class="text-muted">Guarda códigos para acceso rápido</p>
                            <button class="btn btn-primary" onclick="cie10Manager.loadChapters()">
                                Explorar Capítulos
                            </button>
                        </div>
                    </div>
                `;
            }
            return;
        }

        // Buscar todas las condiciones favoritas
        const database = this.getCIE10Database();
        const favoriteConditions = [];

        Object.keys(database).forEach(chapterKey => {
            const chapter = database[chapterKey];
            chapter.conditions.forEach(condition => {
                if (this.favorites.includes(condition.id)) {
                    favoriteConditions.push({
                        ...condition,
                        chapter: chapter,
                        chapterKey: chapterKey
                    });
                }
            });
        });

        this.displaySearchResults(favoriteConditions, 'Favoritos');
    }

    // Rastrear uso de código
    trackCodeUsage(code, name) {
        const usageKey = 'cie10_code_usage';
        let usage = JSON.parse(localStorage.getItem(usageKey)) || {};
        
        if (!usage[code]) {
            usage[code] = {
                code: code,
                name: name,
                count: 0,
                lastUsed: null
            };
        }
        
        usage[code].count += 1;
        usage[code].lastUsed = new Date().toISOString();
        usage[code].name = name; // Actualizar nombre por si cambió
        
        localStorage.setItem(usageKey, JSON.stringify(usage));
    }

    // Obtener códigos más usados
    getMostUsedCodes(limit = 6) {
        const usageKey = 'cie10_code_usage';
        let usage = JSON.parse(localStorage.getItem(usageKey)) || {};
        
        // Si no hay datos, retornar códigos por defecto
        if (Object.keys(usage).length === 0) {
            return [
                { code: 'F32.9', name: 'Episodio depresivo sin especificación', count: 0 },
                { code: 'F41.1', name: 'Trastorno de ansiedad generalizada', count: 0 },
                { code: 'F20.9', name: 'Esquizofrenia sin especificación', count: 0 },
                { code: 'F43.1', name: 'Trastorno de estrés postraumático', count: 0 },
                { code: 'F31', name: 'Trastorno afectivo bipolar', count: 0 },
                { code: 'F60.3', name: 'Trastorno de inestabilidad emocional de la personalidad', count: 0 }
            ];
        }
        
        // Convertir objeto a array y ordenar por count
        const sortedCodes = Object.values(usage)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
        
        return sortedCodes;
    }

    // Cargar y mostrar códigos más usados
    loadMostUsedCodes() {
        const container = document.getElementById('mostUsedCodesContainer');
        if (!container) return;

        const mostUsed = this.getMostUsedCodes(6);
        
        container.innerHTML = `
            <div class="row">
                ${mostUsed.map((code, index) => `
                    <div class="col-md-4 mb-3">
                        <div class="card border-0 bg-light hover-card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div class="flex-grow-1">
                                        <h6 class="card-title mb-1">
                                            <span class="badge bg-primary me-2">#${index + 1}</span>
                                            ${code.code}
                                        </h6>
                                        <p class="card-text small text-muted mb-0">${code.name}</p>
                                        ${code.count > 0 ? `<small class="text-success"><i class="fas fa-chart-line me-1"></i>${code.count} ${code.count === 1 ? 'consulta' : 'consultas'}</small>` : ''}
                                    </div>
                                    <button class="btn btn-sm btn-outline-primary" onclick="showCodeDetails('${code.code}', '${code.name.replace(/'/g, "\\'")}', '')">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    window.cie10Manager = new CIE10Manager();
});

// Función global para mostrar favoritos
function showFavorites() {
    if (window.cie10Manager) {
        window.cie10Manager.showFavorites();
    }
}

// Función global para mostrar capítulo específico
function showChapter(chapterCode) {
    // Base de datos de códigos CIE-10 por capítulo
    const chapterData = {
        'F00-F09': {
            title: 'Trastornos Mentales Orgánicos (F00-F09)',
            description: 'Demencia, delirium y otros trastornos mentales orgánicos',
            codes: [
                { code: 'F00', name: 'Demencia en la enfermedad de Alzheimer' },
                { code: 'F01', name: 'Demencia vascular' },
                { code: 'F02', name: 'Demencia en otras enfermedades' },
                { code: 'F03', name: 'Demencia sin especificación' },
                { code: 'F04', name: 'Síndrome amnésico orgánico' },
                { code: 'F05', name: 'Delirium no inducido por alcohol u otras sustancias' },
                { code: 'F06', name: 'Otros trastornos mentales debidos a lesión cerebral' },
                { code: 'F07', name: 'Trastornos de la personalidad y del comportamiento' },
                { code: 'F09', name: 'Trastorno mental orgánico sin especificación' }
            ]
        },
        'F10-F19': {
            title: 'Trastornos por Uso de Sustancias (F10-F19)',
            description: 'Alcohol, drogas y otras sustancias psicoactivas',
            codes: [
                { code: 'F10', name: 'Trastornos mentales y del comportamiento debidos al uso de alcohol' },
                { code: 'F11', name: 'Trastornos debidos al uso de opiáceos' },
                { code: 'F12', name: 'Trastornos debidos al uso de cannabinoides' },
                { code: 'F13', name: 'Trastornos debidos al uso de sedantes o hipnóticos' },
                { code: 'F14', name: 'Trastornos debidos al uso de cocaína' },
                { code: 'F15', name: 'Trastornos debidos al uso de otros estimulantes' },
                { code: 'F16', name: 'Trastornos debidos al uso de alucinógenos' },
                { code: 'F17', name: 'Trastornos debidos al uso de tabaco' },
                { code: 'F18', name: 'Trastornos debidos al uso de disolventes volátiles' },
                { code: 'F19', name: 'Trastornos debidos al uso de múltiples drogas' }
            ]
        },
        'F20-F29': {
            title: 'Esquizofrenia y Trastornos Psicóticos (F20-F29)',
            description: 'Esquizofrenia, trastornos esquizotípicos y de ideas delirantes',
            codes: [
                { code: 'F20', name: 'Esquizofrenia' },
                { code: 'F20.0', name: 'Esquizofrenia paranoide' },
                { code: 'F20.1', name: 'Esquizofrenia hebefrenia' },
                { code: 'F20.2', name: 'Esquizofrenia catatónica' },
                { code: 'F20.3', name: 'Esquizofrenia indiferenciada' },
                { code: 'F20.9', name: 'Esquizofrenia sin especificación' },
                { code: 'F21', name: 'Trastorno esquizotípico' },
                { code: 'F22', name: 'Trastornos de ideas delirantes persistentes' },
                { code: 'F23', name: 'Trastornos psicóticos agudos y transitorios' },
                { code: 'F24', name: 'Trastorno de ideas delirantes inducidas' },
                { code: 'F25', name: 'Trastornos esquizoafectivos' },
                { code: 'F28', name: 'Otros trastornos psicóticos no orgánicos' },
                { code: 'F29', name: 'Psicosis no orgánica sin especificación' }
            ]
        },
        'F30-F39': {
            title: 'Trastornos del Estado de Ánimo (F30-F39)',
            description: 'Episodios maníacos, depresivos y trastornos bipolares',
            codes: [
                { code: 'F30', name: 'Episodio maníaco' },
                { code: 'F31', name: 'Trastorno afectivo bipolar' },
                { code: 'F32', name: 'Episodios depresivos' },
                { code: 'F32.0', name: 'Episodio depresivo leve' },
                { code: 'F32.1', name: 'Episodio depresivo moderado' },
                { code: 'F32.2', name: 'Episodio depresivo grave sin síntomas psicóticos' },
                { code: 'F32.3', name: 'Episodio depresivo grave con síntomas psicóticos' },
                { code: 'F32.9', name: 'Episodio depresivo sin especificación' },
                { code: 'F33', name: 'Trastorno depresivo recurrente' },
                { code: 'F34', name: 'Trastornos del humor [afectivos] persistentes' },
                { code: 'F34.1', name: 'Distimia' },
                { code: 'F38', name: 'Otros trastornos del humor [afectivos]' },
                { code: 'F39', name: 'Trastorno del humor [afectivo] sin especificación' }
            ]
        },
        'F40-F48': {
            title: 'Trastornos Neuróticos (F40-F48)',
            description: 'Fobias, ansiedad, TOC y estrés',
            codes: [
                { code: 'F40', name: 'Trastornos de ansiedad fóbica' },
                { code: 'F40.0', name: 'Agorafobia' },
                { code: 'F40.1', name: 'Fobias sociales' },
                { code: 'F40.2', name: 'Fobias específicas (aisladas)' },
                { code: 'F41', name: 'Otros trastornos de ansiedad' },
                { code: 'F41.0', name: 'Trastorno de pánico [ansiedad paroxística episódica]' },
                { code: 'F41.1', name: 'Trastorno de ansiedad generalizada' },
                { code: 'F41.2', name: 'Trastorno mixto ansioso-depresivo' },
                { code: 'F42', name: 'Trastorno obsesivo-compulsivo' },
                { code: 'F43', name: 'Reacciones a estrés grave y trastornos de adaptación' },
                { code: 'F43.0', name: 'Reacción a estrés agudo' },
                { code: 'F43.1', name: 'Trastorno de estrés postraumático' },
                { code: 'F44', name: 'Trastornos disociativos [de conversión]' },
                { code: 'F45', name: 'Trastornos somatomorfos' },
                { code: 'F48', name: 'Otros trastornos neuróticos' }
            ]
        },
        'F60-F69': {
            title: 'Trastornos de la Personalidad (F60-F69)',
            description: 'Patrones persistentes de comportamiento',
            codes: [
                { code: 'F60', name: 'Trastornos específicos de la personalidad' },
                { code: 'F60.0', name: 'Trastorno paranoide de la personalidad' },
                { code: 'F60.1', name: 'Trastorno esquizoide de la personalidad' },
                { code: 'F60.2', name: 'Trastorno disocial de la personalidad' },
                { code: 'F60.3', name: 'Trastorno de inestabilidad emocional de la personalidad' },
                { code: 'F60.4', name: 'Trastorno histriónico de la personalidad' },
                { code: 'F60.5', name: 'Trastorno anancástico de la personalidad' },
                { code: 'F60.6', name: 'Trastorno ansioso [con conducta de evitación] de la personalidad' },
                { code: 'F60.7', name: 'Trastorno dependiente de la personalidad' },
                { code: 'F60.8', name: 'Otros trastornos específicos de la personalidad' },
                { code: 'F60.9', name: 'Trastorno de la personalidad sin especificación' },
                { code: 'F61', name: 'Trastornos mixtos y otros trastornos de la personalidad' },
                { code: 'F62', name: 'Cambios duraderos de la personalidad' },
                { code: 'F63', name: 'Trastornos de los hábitos y del control de los impulsos' },
                { code: 'F64', name: 'Trastornos de la identidad sexual' },
                { code: 'F65', name: 'Trastornos de la preferencia sexual' },
                { code: 'F66', name: 'Trastornos psicológicos y del comportamiento del desarrollo sexual' },
                { code: 'F68', name: 'Otros trastornos de la personalidad y del comportamiento' },
                { code: 'F69', name: 'Trastorno de la personalidad sin especificación' }
            ]
        }
    };

    const chapter = chapterData[chapterCode];
    if (!chapter) {
        alert('Información no disponible para este capítulo');
        return;
    }

    // Crear modal para mostrar la información
    const modalId = 'chapterModal';
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
                        <h5 class="modal-title" id="chapterModalTitle"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="chapterModalBody">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="exportChapter('${chapterCode}')">
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
    document.getElementById('chapterModalTitle').textContent = chapter.title;
    
    const modalBody = document.getElementById('chapterModalBody');
    modalBody.innerHTML = `
        <div class="mb-4">
            <p class="lead">${chapter.description}</p>
            <hr>
        </div>
        
        <div class="row">
            <div class="col-12">
                <h6 class="mb-3">Códigos disponibles (${chapter.codes.length} códigos):</h6>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-light">
                            <tr>
                                <th style="width: 15%;">Código</th>
                                <th style="width: 65%;">Descripción</th>
                                <th style="width: 20%;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${chapter.codes.map(code => `
                                <tr style="cursor: pointer;" onclick="showCodeDetails('${code.code}', '${code.name.replace(/'/g, "\\'")}', '${chapterCode}')" class="code-row">
                                    <td><strong class="text-primary">${code.code}</strong></td>
                                    <td>${code.name}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary me-1" onclick="event.stopPropagation(); copyCode('${code.code}')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-success" onclick="event.stopPropagation(); addToFavorites('${code.code}', '${code.name.replace(/'/g, "\\'")}')">
                                            <i class="fas fa-star"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-info" onclick="event.stopPropagation(); showCodeDetails('${code.code}', '${code.name.replace(/'/g, "\\'")}', '${chapterCode}')">
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
        
        <div class="alert alert-info mt-4">
            <i class="fas fa-info-circle me-2"></i>
            <strong>Nota:</strong> Esta información es de referencia. Siempre consulte la documentación oficial de la CIE-10 para diagnósticos precisos.
            <br><small class="text-muted mt-2 d-block">
                <i class="fas fa-mouse-pointer me-1"></i>
                Haga clic en cualquier fila para ver información detallada del código
            </small>
        </div>
        
        <style>
            .code-row:hover {
                background-color: #f8f9fa !important;
                transform: translateY(-1px);
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .code-row {
                transition: all 0.2s ease;
            }
        </style>
    `;

    // Mostrar modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

// Función para copiar código al portapapeles
function copyCode(code) {
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

// Función para agregar a favoritos
function addToFavorites(code, name) {
    const favorites = JSON.parse(localStorage.getItem('cie10_favorites')) || [];
    const favorite = { code, name, date: new Date().toISOString() };
    
    // Verificar si ya existe
    if (!favorites.find(fav => fav.code === code)) {
        favorites.push(favorite);
        localStorage.setItem('cie10_favorites', JSON.stringify(favorites));
        
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
        alert('Este código ya está en tus favoritos');
    }
}

// Función para exportar capítulo
function exportChapter(chapterCode) {
    // Esta función se puede implementar para exportar la información
    alert(`Función de exportación para ${chapterCode} - Por implementar`);
}

// Función para mostrar detalles específicos de un código
function showCodeDetails(code, name, chapterCode) {
    // Rastrear uso del código
    if (window.cie10Manager) {
        window.cie10Manager.trackCodeUsage(code, name);
        // Actualizar la lista de más usados después de rastrear
        setTimeout(() => {
            window.cie10Manager.loadMostUsedCodes();
        }, 100);
    }
    
    // Base de datos detallada de códigos CIE-10
    const codeDetails = {
        // F00-F09: Trastornos Mentales Orgánicos
        'F00': {
            name: 'Demencia en la enfermedad de Alzheimer',
            description: 'Deterioro cognitivo progresivo en el contexto de la enfermedad de Alzheimer',
            criteria: [
                'Deterioro de la memoria (inicial: reciente; tardío: remota)',
                'Deterioro de otras funciones cognitivas superiores',
                'Ausencia de compromiso de conciencia',
                'Deterioro del control emocional, motivación social o del comportamiento'
            ],
            subcodes: ['F00.0 - Inicio temprano', 'F00.1 - Inicio tardío', 'F00.2 - Forma atípica o mixta'],
            treatment: 'Inhibidores de colinesterasa, antagonistas NMDA, manejo de síntomas conductuales'
        },
        'F01': {
            name: 'Demencia vascular',
            description: 'Deterioro cognitivo resultado de enfermedad cerebrovascular',
            criteria: [
                'Deterioro de la memoria',
                'Deterioro del pensamiento abstracto',
                'Deterioro del juicio',
                'Otros trastornos de las funciones corticales superiores',
                'Cambios de personalidad'
            ],
            subcodes: ['F01.0 - Inicio agudo', 'F01.1 - Multi-infarto', 'F01.2 - Subcortical'],
            treatment: 'Control de factores de riesgo vascular, antiagregantes, rehabilitación cognitiva'
        },
        'F02': {
            name: 'Demencia en otras enfermedades',
            description: 'Demencia que se desarrolla como manifestación o consecuencia de otras enfermedades cerebrales o sistémicas',
            criteria: [
                'Deterioro de la memoria y otras funciones cognitivas',
                'Evidencia de otra enfermedad específica responsable',
                'Relación temporal entre enfermedad y demencia',
                'Deterioro funcional significativo'
            ],
            subcodes: ['F02.0 - Pick', 'F02.1 - Creutzfeldt-Jakob', 'F02.3 - Parkinson', 'F02.4 - VIH'],
            treatment: 'Tratamiento de enfermedad subyacente, manejo sintomático, apoyo cognitivo'
        },
        'F03': {
            name: 'Demencia sin especificación',
            description: 'Síndrome demencial que no puede clasificarse en categorías específicas',
            criteria: [
                'Deterioro cognitivo múltiple',
                'Deterioro funcional significativo',
                'No hay evidencia clara de etiología específica',
                'Información insuficiente para diagnóstico más preciso'
            ],
            subcodes: [],
            treatment: 'Evaluación diagnóstica completa, manejo sintomático, apoyo familiar'
        },
        'F04': {
            name: 'Síndrome amnésico orgánico',
            description: 'Deterioro prominente de la memoria reciente y remota con preservación de otras funciones cognitivas',
            criteria: [
                'Deterioro de memoria reciente (aprendizaje)',
                'Reducción de capacidad para recordar material pasado',
                'Déficit de sentido temporal',
                'Ausencia de compromiso de conciencia',
                'Confabulación puede estar presente'
            ],
            subcodes: ['F04.0 - Síndrome de Korsakov no alcohólico'],
            treatment: 'Tiamina (si deficiencia), tratamiento de causa subyacente, rehabilitación cognitiva'
        },
        'F05': {
            name: 'Delirium no inducido por alcohol u otras sustancias',
            description: 'Síndrome cerebral orgánico con alteración simultánea de múltiples funciones',
            criteria: [
                'Reducción de claridad de conciencia',
                'Deterioro de atención',
                'Alteración cognitiva global',
                'Alteración psicomotora',
                'Alteración del ciclo sueño-vigilia',
                'Inicio agudo y curso fluctuante'
            ],
            subcodes: ['F05.0 - No superpuesto a demencia', 'F05.1 - Superpuesto a demencia'],
            treatment: 'Identificar y tratar causa, haloperidol en agitación, medidas ambientales'
        },
        'F06': {
            name: 'Otros trastornos mentales debidos a lesión cerebral',
            description: 'Trastornos mentales específicos debidos a enfermedad, daño o disfunción cerebral',
            criteria: [
                'Evidencia de enfermedad, daño o disfunción cerebral',
                'Relación temporal entre condición y trastorno mental',
                'Remisión del trastorno tras resolución de causa',
                'Ausencia de explicación alternativa'
            ],
            subcodes: ['F06.0 - Alucinosis orgánica', 'F06.2 - Trastorno delirante orgánico', 'F06.3 - Trastornos del humor'],
            treatment: 'Tratamiento de enfermedad base, psicofármacos según sintomatología'
        },
        'F07': {
            name: 'Trastornos de la personalidad y del comportamiento',
            description: 'Alteración de personalidad y comportamiento debido a enfermedad, daño o disfunción cerebral',
            criteria: [
                'Alteración significativa de personalidad previa',
                'Cambios en expresión de emociones',
                'Alteración de necesidades y control de impulsos',
                'Deterioro cognitivo puede estar presente',
                'Evidencia de causa cerebral'
            ],
            subcodes: ['F07.0 - Trastorno orgánico de personalidad', 'F07.1 - Síndrome posencefalítico', 'F07.2 - Síndrome posconmoción'],
            treatment: 'Manejo conductual, psicofármacos, rehabilitación neuropsicológica'
        },
        'F09': {
            name: 'Trastorno mental orgánico o sintomático sin especificación',
            description: 'Trastorno mental claramente atribuible a causa orgánica pero sin especificación adicional',
            criteria: [
                'Evidencia de patología cerebral',
                'Síntomas mentales presentes',
                'Relación temporal establecida',
                'Información insuficiente para diagnóstico más específico'
            ],
            subcodes: [],
            treatment: 'Evaluación diagnóstica detallada, tratamiento sintomático'
        },
        
        // F10-F19: Trastornos por Uso de Sustancias
        'F10': {
            name: 'Trastornos mentales y del comportamiento debidos al uso de alcohol',
            description: 'Conjunto de trastornos relacionados con el consumo de alcohol',
            criteria: [
                'Patrón de consumo problemático',
                'Dependencia física o psicológica',
                'Síntomas de abstinencia al cesar',
                'Tolerancia al alcohol',
                'Deterioro funcional o malestar'
            ],
            subcodes: ['F10.0 - Intoxicación aguda', 'F10.1 - Uso nocivo', 'F10.2 - Síndrome de dependencia', 'F10.3 - Síndrome de abstinencia'],
            treatment: 'Desintoxicación supervisada, benzodiacepinas, tiamina, naltrexona, disulfiram, psicoterapia'
        },
        'F11': {
            name: 'Trastornos por uso de opioides',
            description: 'Trastornos relacionados con el uso de sustancias opioides',
            criteria: [
                'Uso compulsivo de opioides',
                'Dependencia física con síndrome de abstinencia',
                'Tolerancia significativa',
                'Deterioro funcional severo',
                'Continuación a pesar de consecuencias'
            ],
            subcodes: ['F11.0 - Intoxicación aguda', 'F11.1 - Uso nocivo', 'F11.2 - Síndrome de dependencia', 'F11.3 - Abstinencia'],
            treatment: 'Metadona, buprenorfina, naltrexona, terapia conductual, apoyo psicosocial'
        },
        'F12': {
            name: 'Trastornos por uso de cannabinoides',
            description: 'Trastornos relacionados con el consumo de cannabis y derivados',
            criteria: [
                'Patrón de uso problemático',
                'Dependencia psicológica',
                'Deterioro cognitivo temporal',
                'Síntomas de abstinencia leves',
                'Interferencia con actividades'
            ],
            subcodes: ['F12.0 - Intoxicación aguda', 'F12.1 - Uso nocivo', 'F12.2 - Síndrome de dependencia'],
            treatment: 'Terapia cognitivo-conductual, entrevista motivacional, grupos de apoyo'
        },
        'F13': {
            name: 'Trastornos por uso de sedantes o hipnóticos',
            description: 'Trastornos relacionados con benzodiacepinas y otros sedantes',
            criteria: [
                'Uso prolongado de sedantes',
                'Desarrollo de tolerancia',
                'Síndrome de abstinencia al cesar',
                'Uso a pesar de problemas',
                'Deterioro funcional'
            ],
            subcodes: ['F13.0 - Intoxicación aguda', 'F13.2 - Síndrome de dependencia', 'F13.3 - Abstinencia'],
            treatment: 'Reducción gradual supervisada, terapia cognitivo-conductual, manejo de ansiedad subyacente'
        },
        'F14': {
            name: 'Trastornos por uso de cocaína',
            description: 'Trastornos relacionados con el consumo de cocaína',
            criteria: [
                'Uso compulsivo de cocaína',
                'Dependencia psicológica intensa',
                'Tolerancia al efecto',
                'Síndrome de abstinencia (depresión, fatiga)',
                'Consecuencias médicas y sociales'
            ],
            subcodes: ['F14.0 - Intoxicación aguda', 'F14.1 - Uso nocivo', 'F14.2 - Síndrome de dependencia'],
            treatment: 'Terapia cognitivo-conductual, manejo contingente, grupos de apoyo, tratamiento comorbilidades'
        },
        'F15': {
            name: 'Trastornos por uso de estimulantes (anfetaminas)',
            description: 'Trastornos relacionados con el uso de anfetaminas y estimulantes',
            criteria: [
                'Patrón de uso crónico',
                'Dependencia psicológica',
                'Síntomas psicóticos transitorios',
                'Deterioro cognitivo y funcional',
                'Abstinencia con depresión'
            ],
            subcodes: ['F15.0 - Intoxicación aguda', 'F15.2 - Síndrome de dependencia', 'F15.5 - Trastorno psicótico'],
            treatment: 'Terapia conductual, manejo de psicosis, tratamiento de depresión, rehabilitación'
        },
        'F16': {
            name: 'Trastornos por uso de alucinógenos',
            description: 'Trastornos relacionados con LSD, psilocibina y otros alucinógenos',
            criteria: [
                'Alteraciones perceptivas significativas',
                'Despersonalización/desrealización',
                'Flashbacks (trastorno perceptivo persistente)',
                'Ansiedad o pánico',
                'Juicio alterado'
            ],
            subcodes: ['F16.0 - Intoxicación aguda', 'F16.7 - Trastorno psicótico residual'],
            treatment: 'Ambiente tranquilo, benzodiacepinas si agitación, psicoterapia de apoyo'
        },
        'F17': {
            name: 'Trastornos por uso de tabaco',
            description: 'Trastornos relacionados con el consumo de nicotina/tabaco',
            criteria: [
                'Uso diario de tabaco',
                'Dependencia física a nicotina',
                'Síndrome de abstinencia al cesar',
                'Intentos fallidos de dejar',
                'Continuación a pesar de problemas de salud'
            ],
            subcodes: ['F17.2 - Síndrome de dependencia', 'F17.3 - Síndrome de abstinencia'],
            treatment: 'Terapia de reemplazo nicotínico, bupropión, vareniclina, terapia conductual'
        },
        'F18': {
            name: 'Trastornos por uso de solventes volátiles',
            description: 'Trastornos relacionados con inhalación de solventes',
            criteria: [
                'Inhalación repetida de sustancias volátiles',
                'Deterioro cognitivo',
                'Daño neurológico posible',
                'Alteraciones conductuales',
                'Uso a pesar de consecuencias graves'
            ],
            subcodes: ['F18.0 - Intoxicación aguda', 'F18.2 - Síndrome de dependencia'],
            treatment: 'Evaluación neurológica, terapia conductual, tratamiento de daño orgánico'
        },
        'F19': {
            name: 'Trastornos por uso de múltiples drogas',
            description: 'Uso problemático de múltiples sustancias psicoactivas simultáneamente',
            criteria: [
                'Uso de 2 o más sustancias',
                'Patrón caótico de policonsumo',
                'Dependencia de varias sustancias',
                'Deterioro funcional severo',
                'Complicaciones médicas múltiples'
            ],
            subcodes: ['F19.2 - Síndrome de dependencia', 'F19.5 - Trastorno psicótico'],
            treatment: 'Desintoxicación integral, tratamiento residencial, abordaje de comorbilidades'
        },
        
        // F20-F29: Esquizofrenia y trastornos psicóticos
        'F20': {
            name: 'Esquizofrenia',
            description: 'Trastorno mental crónico caracterizado por distorsiones del pensamiento y la percepción',
            criteria: [
                'Delirios',
                'Alucinaciones',
                'Lenguaje desorganizado',
                'Comportamiento catatónico o desorganizado',
                'Síntomas negativos (aplanamiento afectivo, alogia, abulia)'
            ],
            subcodes: ['F20.0 - Paranoide', 'F20.1 - Hebefrenia', 'F20.2 - Catatónica', 'F20.9 - Sin especificación'],
            treatment: 'Antipsicóticos atípicos, terapia psicosocial, rehabilitación comunitaria'
        },
        'F20.0': {
            name: 'Esquizofrenia paranoide',
            description: 'Forma más común de esquizofrenia, dominada por delirios y alucinaciones',
            criteria: [
                'Preocupación por uno o más delirios',
                'Alucinaciones auditivas frecuentes',
                'No hay lenguaje desorganizado',
                'No hay comportamiento catatónico o desorganizado',
                'No hay afecto aplanado o inapropiado'
            ],
            subcodes: [],
            treatment: 'Antipsicóticos (risperidona, olanzapina), terapia cognitivo-conductual'
        },
        'F20.1': {
            name: 'Esquizofrenia hebefrénica',
            description: 'Forma de esquizofrenia con predominio de síntomas afectivos y conductuales desorganizados',
            criteria: [
                'Afecto superficial e inapropiado',
                'Comportamiento desorganizado',
                'Lenguaje desorganizado',
                'Alucinaciones y delirios fragmentarios',
                'Deterioro funcional marcado'
            ],
            subcodes: [],
            treatment: 'Antipsicóticos, terapia ocupacional, apoyo estructurado intensivo'
        },
        'F20.2': {
            name: 'Esquizofrenia catatónica',
            description: 'Forma de esquizofrenia dominada por alteraciones psicomotoras',
            criteria: [
                'Estupor o mutismo',
                'Excitación psicomotora',
                'Adopción de posturas',
                'Negativismo',
                'Rigidez, flexibilidad cérea',
                'Obediencia automática o ecopraxia'
            ],
            subcodes: [],
            treatment: 'Benzodiacepinas (lorazepam), TEC en casos refractarios, antipsicóticos'
        },
        'F21': {
            name: 'Trastorno esquizotípico',
            description: 'Patrón persistente de déficits sociales e interpersonales con distorsiones cognitivas y perceptivas',
            criteria: [
                'Ideas de referencia',
                'Creencias extrañas o pensamiento mágico',
                'Experiencias perceptivas inusuales',
                'Pensamiento y lenguaje extraños',
                'Suspicacia o ideación paranoide',
                'Afecto inapropiado o restringido',
                'Comportamiento o apariencia extraños',
                'Falta de amigos íntimos',
                'Ansiedad social excesiva'
            ],
            subcodes: [],
            treatment: 'Antipsicóticos en dosis bajas, psicoterapia, habilidades sociales'
        },
        'F22': {
            name: 'Trastornos delirantes persistentes',
            description: 'Delirio o conjunto de delirios persistentes sin otros síntomas psicóticos prominentes',
            criteria: [
                'Delirio(s) presente(s) por al menos 1 mes',
                'Delirios no bizarros',
                'No hay alucinaciones prominentes',
                'Funcionamiento relativamente preservado',
                'No hay deterioro cognitivo significativo'
            ],
            subcodes: ['F22.0 - Trastorno delirante', 'F22.8 - Otros'],
            treatment: 'Antipsicóticos, psicoterapia cognitiva, manejo de complicaciones'
        },
        'F23': {
            name: 'Trastornos psicóticos agudos y transitorios',
            description: 'Trastornos psicóticos de inicio agudo y duración limitada',
            criteria: [
                'Inicio agudo (menos de 2 semanas)',
                'Síntomas psicóticos polimorfos',
                'Puede haber estrés precipitante',
                'Confusión o perplejidad',
                'Resolución completa en menos de 3 meses'
            ],
            subcodes: ['F23.0 - Sin síntomas esquizofrénicos', 'F23.1 - Con síntomas esquizofrénicos'],
            treatment: 'Antipsicóticos de corta duración, manejo del estrés, psicoterapia de apoyo'
        },
        'F24': {
            name: 'Trastorno delirante inducido',
            description: 'Desarrollo de delirio en persona en relación cercana con otra que ya tiene delirio',
            criteria: [
                'Delirio desarrollado en contexto de relación cercana',
                'Delirio similar en contenido al de persona primaria',
                'Apoyo mutuo en creencias delirantes',
                'Relación estrecha y aislamiento social',
                'Remisión al separar las personas'
            ],
            subcodes: [],
            treatment: 'Separación física, antipsicóticos, psicoterapia individual'
        },
        'F25': {
            name: 'Trastornos esquizoafectivos',
            description: 'Trastorno con síntomas esquizofrénicos y afectivos prominentes en mismo episodio',
            criteria: [
                'Síntomas esquizofrénicos y afectivos simultáneos',
                'Ambos grupos de síntomas son prominentes',
                'Episodio dura al menos 2 semanas',
                'No cumple criterios para esquizofrenia sola ni trastorno afectivo solo'
            ],
            subcodes: ['F25.0 - Tipo maníaco', 'F25.1 - Tipo depresivo', 'F25.2 - Tipo mixto'],
            treatment: 'Combinación de antipsicóticos y estabilizadores del ánimo o antidepresivos'
        },
        'F28': {
            name: 'Otros trastornos psicóticos no orgánicos',
            description: 'Trastornos psicóticos que no cumplen criterios para categorías específicas',
            criteria: [
                'Síntomas psicóticos presentes',
                'No cumple criterios para trastornos específicos',
                'Puede incluir psicosis cicloide',
                'Presentación atípica'
            ],
            subcodes: [],
            treatment: 'Antipsicóticos según sintomatología, evaluación diagnóstica continua'
        },
        'F29': {
            name: 'Psicosis no orgánica sin especificación',
            description: 'Trastorno psicótico de causa no orgánica sin información suficiente para diagnóstico específico',
            criteria: [
                'Presencia de síntomas psicóticos',
                'Causa orgánica descartada',
                'Información insuficiente para clasificación específica'
            ],
            subcodes: [],
            treatment: 'Evaluación diagnóstica completa, antipsicóticos, estabilización'
        },
        
        // F30-F39: Trastornos del humor (afectivos)
        'F30': {
            name: 'Episodio maníaco',
            description: 'Período de estado de ánimo elevado, expansivo o irritable anormalmente persistente',
            criteria: [
                'Estado de ánimo elevado o irritable',
                'Aumento de autoestima o grandiosidad',
                'Disminución de necesidad de sueño',
                'Más hablador de lo habitual',
                'Fuga de ideas',
                'Aumento de actividad dirigida a objetivos',
                'Implicación excesiva en actividades placenteras con alto potencial de consecuencias'
            ],
            subcodes: ['F30.0 - Hipomanía', 'F30.1 - Manía sin síntomas psicóticos', 'F30.2 - Manía con síntomas psicóticos'],
            treatment: 'Litio, ácido valproico, antipsicóticos atípicos, hospitalización si necesario'
        },
        'F31': {
            name: 'Trastorno bipolar',
            description: 'Trastorno caracterizado por episodios repetidos de alteración del humor',
            criteria: [
                'Al menos 2 episodios de alteración del humor',
                'Al menos uno debe ser maníaco o mixto',
                'Patrón episódico recurrente',
                'Períodos de remisión entre episodios',
                'Deterioro funcional significativo'
            ],
            subcodes: ['F31.0 - Episodio actual hipomaníaco', 'F31.3 - Episodio actual depresivo leve', 'F31.4 - Depresivo moderado'],
            treatment: 'Estabilizadores del ánimo (litio, valproato), antipsicóticos atípicos, psicoterapia'
        },
        'F32': {
            name: 'Episodios depresivos',
            description: 'Episodios de depresión mayor con diferentes grados de severidad',
            criteria: [
                'Estado de ánimo deprimido',
                'Pérdida de interés o placer',
                'Fatiga o pérdida de energía',
                'Sentimientos de inutilidad o culpa',
                'Problemas de concentración',
                'Pensamientos de muerte o suicidio'
            ],
            subcodes: ['F32.0 - Leve', 'F32.1 - Moderado', 'F32.2 - Grave sin síntomas psicóticos', 'F32.3 - Grave con síntomas psicóticos'],
            treatment: 'Antidepresivos (ISRS, IRSN), psicoterapia, terapia electroconvulsiva en casos graves'
        },
        'F32.0': {
            name: 'Episodio depresivo leve',
            description: 'Episodio depresivo con síntomas suficientes para diagnóstico pero de intensidad leve',
            criteria: [
                'Al menos 2 síntomas principales (ánimo deprimido, anhedonia, fatiga)',
                'Al menos 2 síntomas adicionales',
                'Duración mínima 2 semanas',
                'Alguna dificultad funcional pero continúa la mayoría de actividades'
            ],
            subcodes: [],
            treatment: 'Psicoterapia preferentemente, considerar antidepresivos si no respuesta'
        },
        'F32.1': {
            name: 'Episodio depresivo moderado',
            description: 'Episodio depresivo con considerable dificultad para continuar actividades',
            criteria: [
                'Al menos 2 síntomas principales',
                'Al menos 3-4 síntomas adicionales',
                'Duración mínima 2 semanas',
                'Considerable dificultad para actividades sociales, laborales y domésticas'
            ],
            subcodes: [],
            treatment: 'Antidepresivos (ISRS como primera línea) más psicoterapia'
        },
        'F32.2': {
            name: 'Episodio depresivo grave sin síntomas psicóticos',
            description: 'Episodio depresivo con síntomas marcados y angustiantes',
            criteria: [
                'Todos los 3 síntomas principales',
                'Al menos 4 síntomas adicionales, algunos deben ser de intensidad grave',
                'Síntomas somáticos típicamente presentes',
                'Incapacidad para actividades sociales, laborales o domésticas'
            ],
            subcodes: [],
            treatment: 'Antidepresivos (ISRS/IRSN), considerar TEC, hospitalización si riesgo suicida'
        },
        'F32.3': {
            name: 'Episodio depresivo grave con síntomas psicóticos',
            description: 'Episodio depresivo grave acompañado de alucinaciones, delirios o estupor depresivo',
            criteria: [
                'Criterios de episodio depresivo grave cumplidos',
                'Presencia de alucinaciones, delirios o estupor',
                'Síntomas psicóticos típicamente congruentes con estado de ánimo',
                'Riesgo suicida elevado'
            ],
            subcodes: [],
            treatment: 'Combinación antidepresivo + antipsicótico, TEC, hospitalización'
        },
        'F32.9': {
            name: 'Episodio depresivo sin especificación',
            description: 'Episodio depresivo que no se puede clasificar en las categorías específicas',
            criteria: [
                'Cumple criterios para episodio depresivo',
                'No se puede determinar la severidad específica',
                'Información insuficiente para clasificación más precisa'
            ],
            subcodes: [],
            treatment: 'Evaluación detallada, antidepresivos según severidad clínica'
        },
        'F33': {
            name: 'Trastorno depresivo recurrente',
            description: 'Trastorno caracterizado por episodios repetidos de depresión',
            criteria: [
                'Al menos 2 episodios depresivos',
                'Separados por meses libres de síntomas significativos',
                'Nunca ha habido episodios maníacos o hipomaníacos',
                'Episodios cumplen criterios para episodio depresivo',
                'Patrón recurrente establecido'
            ],
            subcodes: ['F33.0 - Episodio actual leve', 'F33.1 - Moderado', 'F33.2 - Grave sin psicosis', 'F33.3 - Con psicosis'],
            treatment: 'Antidepresivos a largo plazo, psicoterapia, profilaxis de recaídas'
        },
        'F34': {
            name: 'Trastornos del humor persistentes',
            description: 'Trastornos crónicos del humor de intensidad fluctuante',
            criteria: [
                'Alteración del humor persistente (años)',
                'Intensidad insuficiente para episodio depresivo o maníaco',
                'Períodos de normalidad breves si presentes',
                'Deterioro funcional significativo acumulativo'
            ],
            subcodes: ['F34.0 - Ciclotimia', 'F34.1 - Distimia'],
            treatment: 'Antidepresivos, estabilizadores del ánimo, psicoterapia a largo plazo'
        },
        'F34.1': {
            name: 'Distimia',
            description: 'Depresión crónica de al menos 2 años de duración pero de intensidad insuficiente para episodio depresivo',
            criteria: [
                'Estado de ánimo deprimido la mayor parte del día',
                'Presente más días que ausente durante 2+ años',
                'No libre de síntomas más de 2 meses seguidos',
                'Nunca ha cumplido criterios para episodio depresivo mayor',
                'Al menos 2 síntomas: apetito alterado, sueño alterado, fatiga, baja autoestima, concentración pobre, desesperanza'
            ],
            subcodes: [],
            treatment: 'Antidepresivos (ISRS), psicoterapia cognitiva, ejercicio, higiene del sueño'
        },
        'F38': {
            name: 'Otros trastornos del humor',
            description: 'Trastornos del humor que no cumplen criterios para categorías específicas',
            criteria: [
                'Alteración del humor significativa',
                'No cumple criterios para trastornos específicos',
                'Puede incluir episodios mixtos breves',
                'Presentación atípica'
            ],
            subcodes: ['F38.0 - Episodios afectivos mixtos'],
            treatment: 'Estabilizadores del ánimo, evaluación diagnóstica continua'
        },
        'F39': {
            name: 'Trastorno del humor sin especificación',
            description: 'Trastorno del humor sin información suficiente para diagnóstico específico',
            criteria: [
                'Alteración del humor presente',
                'Información insuficiente para clasificación específica',
                'Requiere evaluación adicional'
            ],
            subcodes: [],
            treatment: 'Evaluación diagnóstica completa, tratamiento sintomático'
        },
        
        // F40-F48: Trastornos neuróticos y relacionados con estrés
        'F40': {
            name: 'Trastornos de ansiedad fóbica',
            description: 'Grupo de trastornos con ansiedad provocada por situaciones u objetos específicos',
            criteria: [
                'Ansiedad marcada ante situación/objeto específico',
                'Evitación del estímulo fóbico',
                'Síntomas ansiosos en exposición',
                'Reconocimiento de irracionalidad',
                'Deterioro funcional significativo'
            ],
            subcodes: ['F40.0 - Agorafobia', 'F40.1 - Fobias sociales', 'F40.2 - Fobias específicas'],
            treatment: 'Terapia de exposición, TCC, ISRS en casos severos'
        },
        'F40.1': {
            name: 'Fobias sociales',
            description: 'Miedo marcado y persistente a situaciones sociales o de actuación',
            criteria: [
                'Miedo marcado a situaciones sociales',
                'Temor a humillación o vergüenza',
                'Exposición provoca ansiedad',
                'Reconocimiento de exceso de miedo',
                'Evitación o soportar con intensa ansiedad',
                'Interferencia significativa con rutina'
            ],
            subcodes: [],
            treatment: 'TCC, exposición gradual, ISRS (paroxetina, sertralina), beta-bloqueadores para situaciones específicas'
        },
        'F40.2': {
            name: 'Fobias específicas',
            description: 'Miedo marcado y persistente a objetos o situaciones circunscritas',
            criteria: [
                'Miedo marcado y persistente ante objeto/situación específica',
                'Exposición provoca respuesta ansiosa inmediata',
                'Reconocimiento de irracionalidad',
                'Situación se evita o soporta con intensa ansiedad',
                'Interferencia con funcionamiento'
            ],
            subcodes: ['Tipo animal', 'Tipo ambiental', 'Tipo sangre-inyección-daño', 'Tipo situacional'],
            treatment: 'Terapia de exposición gradual, desensibilización sistemática'
        },
        'F41': {
            name: 'Otros trastornos de ansiedad',
            description: 'Trastornos de ansiedad no limitados a situaciones específicas',
            criteria: [
                'Ansiedad generalizada o ataques de pánico',
                'No restringida a circunstancias particulares',
                'Síntomas ansiosos variables',
                'Puede incluir síntomas depresivos'
            ],
            subcodes: ['F41.0 - Trastorno de pánico', 'F41.1 - Trastorno de ansiedad generalizada', 'F41.2 - Trastorno mixto'],
            treatment: 'ISRS, TCC, técnicas de relajación, benzodiacepinas corto plazo'
        },
        'F41.0': {
            name: 'Trastorno de pánico',
            description: 'Ataques de pánico recurrentes e inesperados con preocupación persistente',
            criteria: [
                'Ataques de pánico recurrentes inesperados',
                'Al menos 1 mes de preocupación por ataques adicionales',
                'Cambios conductuales relacionados con ataques',
                'Ataques no debido a sustancias o condición médica',
                '4+ síntomas: palpitaciones, sudoración, temblor, disnea, sensación de ahogo, dolor torácico, náuseas, mareo, desrealización, miedo a perder control, miedo a morir, parestesias, escalofríos'
            ],
            subcodes: [],
            treatment: 'ISRS (sertralina, paroxetina), TCC con exposición, benzodiacepinas corto plazo'
        },
        'F41.1': {
            name: 'Trastorno de ansiedad generalizada',
            description: 'Ansiedad y preocupación excesivas durante al menos 6 meses',
            criteria: [
                'Ansiedad y preocupación excesivas',
                'Dificultad para controlar la preocupación',
                'Inquietud o sensación de estar en el límite',
                'Fatigabilidad fácil',
                'Dificultad para concentrarse',
                'Irritabilidad',
                'Tensión muscular',
                'Trastornos del sueño'
            ],
            subcodes: [],
            treatment: 'Benzodiacepinas (corto plazo), antidepresivos (ISRS), terapia cognitivo-conductual'
        },
        'F42': {
            name: 'Trastorno obsesivo-compulsivo',
            description: 'Presencia de obsesiones, compulsiones o ambas',
            criteria: [
                'Obsesiones: pensamientos recurrentes intrusivos',
                'Compulsiones: comportamientos repetitivos o actos mentales',
                'Consumo de tiempo (>1 hora/día)',
                'Malestar significativo o deterioro',
                'No atribuible a sustancias'
            ],
            subcodes: ['F42.0 - Predominan obsesiones', 'F42.1 - Predominan compulsiones', 'F42.2 - Mixto'],
            treatment: 'ISRS en dosis altas, clomipramina, TCC con exposición y prevención de respuesta'
        },
        'F43': {
            name: 'Reacciones a estrés grave y trastornos de adaptación',
            description: 'Trastornos que surgen como respuesta a estrés significativo o cambio vital',
            criteria: [
                'Exposición a evento estresante identificable',
                'Síntomas se desarrollan en respuesta temporal clara',
                'Síntomas causan malestar significativo',
                'No explicado mejor por otro trastorno',
                'Remisión tras resolución del estresor'
            ],
            subcodes: ['F43.0 - Reacción aguda al estrés', 'F43.1 - Trastorno de estrés postraumático', 'F43.2 - Trastornos de adaptación'],
            treatment: 'Psicoterapia de apoyo, TCC, medicación sintomática según necesidad'
        },
        'F43.1': {
            name: 'Trastorno de estrés postraumático',
            description: 'Respuesta retardada o prolongada a evento traumático estresante',
            criteria: [
                'Exposición a evento traumático',
                'Reexperimentación persistente (flashbacks, pesadillas)',
                'Evitación de estímulos asociados',
                'Alteraciones negativas en cognición y estado de ánimo',
                'Aumento en excitación y reactividad',
                'Duración >1 mes',
                'Deterioro funcional significativo'
            ],
            subcodes: [],
            treatment: 'TCC centrada en trauma, EMDR, ISRS (sertralina, paroxetina), prazosin para pesadillas'
        },
        'F43.2': {
            name: 'Trastornos de adaptación',
            description: 'Estados de malestar subjetivo y alteración emocional en respuesta a cambio vital o evento estresante',
            criteria: [
                'Inicio dentro de 1 mes de estresor identificable',
                'Síntomas más intensos de lo esperado',
                'Deterioro funcional significativo',
                'No cumple criterios para otro trastorno específico',
                'Remisión dentro de 6 meses tras cesar estresor'
            ],
            subcodes: ['Con ansiedad', 'Con depresión', 'Con alteración mixta de emociones y conducta'],
            treatment: 'Psicoterapia de apoyo, resolución de problemas, medicación sintomática breve'
        },
        'F44': {
            name: 'Trastornos disociativos',
            description: 'Pérdida parcial o completa de integración normal entre memorias, identidad, sensaciones y control de movimientos',
            criteria: [
                'Disrupción de conciencia, memoria, identidad o percepción',
                'No explicado por trastorno neurológico',
                'Causa malestar o deterioro significativo',
                'Frecuentemente relacionado con trauma',
                'Síntomas no producidos intencionalmente'
            ],
            subcodes: ['F44.0 - Amnesia disociativa', 'F44.1 - Fuga disociativa', 'F44.2 - Estupor disociativo', 'F44.4 - Trastornos disociativos del movimiento'],
            treatment: 'Psicoterapia especializada, hipnosis clínica, procesamiento de trauma'
        },
        'F45': {
            name: 'Trastornos somatomorfos',
            description: 'Presencia de síntomas físicos que sugieren condición médica sin explicación médica completa',
            criteria: [
                'Síntomas físicos múltiples y recurrentes',
                'Búsqueda persistente de atención médica',
                'Pruebas médicas repetidas con resultados negativos',
                'Resistencia a aceptar explicación psicológica',
                'Deterioro funcional significativo'
            ],
            subcodes: ['F45.0 - Trastorno de somatización', 'F45.1 - Trastorno somatomorfo indiferenciado', 'F45.2 - Trastorno hipocondríaco'],
            treatment: 'Psicoterapia cognitivo-conductual, médico de cabecera regular, antidepresivos si depresión comórbida'
        },
        'F48': {
            name: 'Otros trastornos neuróticos',
            description: 'Otros trastornos neuróticos especificados que no encajan en categorías anteriores',
            criteria: [
                'Síntomas neuróticos presentes',
                'No cumple criterios para categorías específicas',
                'Puede incluir neurastenia, despersonalización',
                'Malestar o deterioro significativo'
            ],
            subcodes: ['F48.0 - Neurastenia', 'F48.1 - Síndrome de despersonalización-desrealización'],
            treatment: 'Psicoterapia, manejo del estrés, medicación sintomática según necesidad'
        },
        
        // F50-F59: Síndromes del comportamiento asociados con alteraciones fisiológicas
        'F50': {
            name: 'Trastornos de la conducta alimentaria',
            description: 'Trastornos caracterizados por alteraciones graves de la conducta alimentaria',
            criteria: [
                'Alteración persistente en alimentación o comportamiento relacionado',
                'Preocupación excesiva por peso o forma corporal',
                'Deterioro de salud física o funcionamiento',
                'No debido a condición médica'
            ],
            subcodes: ['F50.0 - Anorexia nerviosa', 'F50.2 - Bulimia nerviosa', 'F50.8 - Otros'],
            treatment: 'Psicoterapia (TCC, terapia familiar), manejo nutricional, hospitalización si necesario'
        },
        'F50.0': {
            name: 'Anorexia nerviosa',
            description: 'Trastorno caracterizado por restricción alimentaria, miedo intenso a ganar peso y distorsión de imagen corporal',
            criteria: [
                'Restricción de ingesta energética relativa a necesidades',
                'Peso significativamente bajo',
                'Miedo intenso a ganar peso o engordar',
                'Alteración en percepción de peso o forma corporal',
                'Falta de reconocimiento de gravedad del bajo peso'
            ],
            subcodes: ['F50.00 - Tipo restrictivo', 'F50.01 - Tipo con atracones/purgas'],
            treatment: 'Terapia familiar (adolescentes), TCC, rehabilitación nutricional, hospitalización si IMC crítico'
        },
        'F50.2': {
            name: 'Bulimia nerviosa',
            description: 'Episodios recurrentes de atracones seguidos de conductas compensatorias inapropiadas',
            criteria: [
                'Episodios recurrentes de atracones',
                'Conductas compensatorias inapropiadas recurrentes (vómito, laxantes, ejercicio)',
                'Ocurre al menos 1 vez por semana durante 3 meses',
                'Autoevaluación influida excesivamente por forma y peso corporal',
                'No ocurre exclusivamente durante episodios de anorexia'
            ],
            subcodes: [],
            treatment: 'TCC especializada, ISRS (fluoxetina), manejo nutricional, terapia interpersonal'
        },
        'F50.8': {
            name: 'Otros trastornos de la conducta alimentaria',
            description: 'Trastornos alimentarios que no cumplen criterios para anorexia o bulimia',
            criteria: [
                'Alteración significativa de conducta alimentaria',
                'No cumple criterios completos para anorexia o bulimia',
                'Puede incluir trastorno por atracón',
                'Deterioro funcional presente'
            ],
            subcodes: ['Trastorno por atracón', 'Trastorno alimentario restrictivo/evitativo'],
            treatment: 'TCC, manejo nutricional, medicación según sintomatología'
        },
        'F51': {
            name: 'Trastornos del sueño no orgánicos',
            description: 'Alteraciones del sueño de origen emocional',
            criteria: [
                'Dificultad para iniciar o mantener sueño',
                'Calidad insatisfactoria del sueño',
                'Ocurre al menos 3 veces por semana durante 1+ mes',
                'Preocupación excesiva por insomnio',
                'Deterioro funcional diurno'
            ],
            subcodes: ['F51.0 - Insomnio no orgánico', 'F51.1 - Hipersomnia no orgánica', 'F51.2 - Trastorno del ciclo vigilia-sueño'],
            treatment: 'Higiene del sueño, TCC para insomnio, medicación hipnótica corto plazo si necesario'
        },
        'F52': {
            name: 'Disfunción sexual no orgánica',
            description: 'Disfunciones sexuales de origen psicológico',
            criteria: [
                'Incapacidad para participar satisfactoriamente en relación sexual',
                'No debido a trastorno orgánico',
                'Factores psicológicos significativos',
                'Malestar significativo'
            ],
            subcodes: ['F52.0 - Falta de deseo sexual', 'F52.1 - Aversión sexual', 'F52.2 - Fallo de respuesta genital'],
            treatment: 'Terapia sexual, psicoterapia individual o de pareja, tratamiento de comorbilidades'
        },
        'F53': {
            name: 'Trastornos mentales y del comportamiento asociados con puerperio',
            description: 'Trastornos mentales que ocurren dentro de las 6 semanas posteriores al parto',
            criteria: [
                'Inicio dentro de 6 semanas postparto',
                'No clasificable en otros apartados',
                'Severidad suficiente para requerir atención',
                'Puede incluir depresión o psicosis puerperal'
            ],
            subcodes: ['F53.0 - Trastornos mentales y del comportamiento leves', 'F53.1 - Trastornos mentales y del comportamiento graves'],
            treatment: 'Antidepresivos o antipsicóticos según severidad, psicoterapia, apoyo familiar'
        },
        
        // F60-F69: Trastornos de la personalidad y del comportamiento adulto
        'F60': {
            name: 'Trastornos específicos de la personalidad',
            description: 'Patrones permanentes de experiencia interna y comportamiento que se apartan de expectativas culturales',
            criteria: [
                'Patrón persistente e inflexible',
                'Inicio en adolescencia o adultez temprana',
                'Estable a través del tiempo',
                'Malestar o deterioro significativo',
                'No debido a otro trastorno mental, sustancia o condición médica'
            ],
            subcodes: ['F60.0 - Paranoide', 'F60.1 - Esquizoide', 'F60.2 - Disocial', 'F60.3 - Inestabilidad emocional', 'F60.4 - Histriónico', 'F60.5 - Anancástico', 'F60.6 - Ansioso', 'F60.7 - Dependiente'],
            treatment: 'Psicoterapia a largo plazo (DBT, esquemas, mentalización), medicación sintomática'
        },
        'F60.0': {
            name: 'Trastorno paranoide de la personalidad',
            description: 'Patrón de desconfianza y suspicacia generalizadas',
            criteria: [
                'Sospecha sin base de ser explotado o dañado',
                'Preocupación injustificada sobre lealtad de amigos',
                'Reticencia a confiar',
                'Interpretación de observaciones benign as amenazantes',
                'Rencores persistentes',
                'Percepción de ataques a carácter no aparentes a otros',
                'Sospechas recurrentes sin justificación sobre fidelidad de pareja'
            ],
            subcodes: [],
            treatment: 'Psicoterapia individual, desarrollar confianza terapéutica, antipsicóticos bajas dosis si ideación severa'
        },
        'F60.1': {
            name: 'Trastorno esquizoide de la personalidad',
            description: 'Patrón de desapego de relaciones sociales y rango restringido de expresión emocional',
            criteria: [
                'No desea ni disfruta relaciones cercanas',
                'Casi siempre elige actividades solitarias',
                'Poco interés en experiencias sexuales',
                'Disfruta pocas actividades',
                'Carece de amigos cercanos',
                'Indiferente a elogios o críticas',
                'Frialdad emocional, desapego o afectividad plana'
            ],
            subcodes: [],
            treatment: 'Psicoterapia individual respetuosa de necesidad de distancia, medicación para ansiedad si presente'
        },
        'F60.2': {
            name: 'Trastorno disocial de la personalidad (antisocial)',
            description: 'Patrón de desprecio y violación de derechos de otros',
            criteria: [
                'Fracaso para conformarse a normas sociales',
                'Engaño, mentiras repetidas',
                'Impulsividad, fracaso para planificar',
                'Irritabilidad y agresividad',
                'Despreocupación por seguridad propia o ajena',
                'Irresponsabilidad persistente',
                'Ausencia de remordimiento'
            ],
            subcodes: [],
            treatment: 'Psicoterapia, programas estructurados, manejo de abuso de sustancias comórbido'
        },
        'F60.3': {
            name: 'Trastorno de inestabilidad emocional de la personalidad',
            description: 'Patrón de inestabilidad en relaciones, autoimagen y afectos',
            criteria: [
                'Esfuerzos para evitar abandono',
                'Relaciones interpersonales inestables e intensas',
                'Alteración de identidad',
                'Impulsividad en áreas potencialmente dañinas',
                'Comportamiento, gestos o amenazas suicidas',
                'Inestabilidad afectiva',
                'Sentimientos crónicos de vacío',
                'Ira intensa inapropiada',
                'Ideación paranoide o síntomas disociativos transitorios'
            ],
            subcodes: ['F60.30 - Tipo impulsivo', 'F60.31 - Tipo límite'],
            treatment: 'Terapia dialéctica conductual (DBT), mentalización, terapia de esquemas'
        },
        'F60.4': {
            name: 'Trastorno histriónico de la personalidad',
            description: 'Patrón de emotividad excesiva y búsqueda de atención',
            criteria: [
                'Malestar si no es centro de atención',
                'Comportamiento seductor o provocativo inapropiado',
                'Expresión emocional superficial y rápidamente cambiante',
                'Uso de apariencia física para atraer atención',
                'Estilo de hablar impresionista y carente de detalles',
                'Dramatización, teatralidad',
                'Sugestionabilidad',
                'Considera relaciones más íntimas de lo que son'
            ],
            subcodes: [],
            treatment: 'Psicoterapia psicodinámica, TCC, manejo de comportamientos de búsqueda de atención'
        },
        'F60.5': {
            name: 'Trastorno anancástico de la personalidad (obsesivo-compulsivo)',
            description: 'Patrón de preocupación por orden, perfeccionismo y control',
            criteria: [
                'Preocupación por detalles, reglas, listas, orden',
                'Perfeccionismo que interfiere con finalización de tareas',
                'Dedicación excesiva al trabajo',
                'Excesivamente concienzudo e inflexible',
                'Incapacidad para desechar objetos',
                'Reticencia a delegar',
                'Avaricia hacia sí mismo y otros',
                'Rigidez y obstinación'
            ],
            subcodes: [],
            treatment: 'TCC, terapia de aceptación y compromiso, abordaje de perfeccionismo'
        },
        'F60.6': {
            name: 'Trastorno ansioso de la personalidad (por evitación)',
            description: 'Patrón de inhibición social, sentimientos de inadecuación e hipersensibilidad',
            criteria: [
                'Evita actividades laborales con contacto interpersonal',
                'Reacio a relacionarse sin garantía de aceptación',
                'Restricción en relaciones íntimas por temor a vergüenza',
                'Preocupado por críticas o rechazo',
                'Inhibido en situaciones nuevas',
                'Se ve socialmente inepto, sin atractivo',
                'Reacio a riesgos personales por potencial vergüenza'
            ],
            subcodes: [],
            treatment: 'TCC con exposición gradual, terapia de grupo, ISRS si ansiedad severa'
        },
        'F60.7': {
            name: 'Trastorno dependiente de la personalidad',
            description: 'Patrón de necesidad excesiva de ser cuidado que lleva a comportamiento sumiso',
            criteria: [
                'Dificultad para tomar decisiones sin consejo excesivo',
                'Necesita que otros asuman responsabilidad',
                'Dificultad para expresar desacuerdo por temor a pérdida de apoyo',
                'Dificultad para iniciar proyectos',
                'Va a extremos para obtener cuidado y apoyo',
                'Se siente incómodo o desamparado cuando solo',
                'Busca urgentemente nueva relación cuando termina una',
                'Preocupación por ser dejado solo'
            ],
            subcodes: [],
            treatment: 'Psicoterapia para fomentar autonomía, asertividad, TCC'
        },
        'F61': {
            name: 'Trastornos mixtos y otros de la personalidad',
            description: 'Trastornos de personalidad que no encajan claramente en tipos específicos',
            criteria: [
                'Rasgos de múltiples trastornos de personalidad',
                'No predomina un patrón único',
                'Deterioro funcional significativo',
                'Patrón persistente e inflexible'
            ],
            subcodes: ['F61.0 - Trastornos mixtos de la personalidad'],
            treatment: 'Psicoterapia enfocada en rasgos problemáticos específicos'
        },
        'F63': {
            name: 'Trastornos de los hábitos y del control de los impulsos',
            description: 'Fracaso repetido para resistir impulsos de realizar acto dañino',
            criteria: [
                'Impulso intenso de realizar acto',
                'Tensión creciente antes del acto',
                'Alivio o gratificación al realizar el acto',
                'Puede haber arrepentimiento posterior',
                'Deterioro funcional o consecuencias negativas'
            ],
            subcodes: ['F63.0 - Ludopatía', 'F63.1 - Piromanía', 'F63.2 - Cleptomanía', 'F63.3 - Tricotilomanía'],
            treatment: 'TCC, terapia de grupo, naltrexona (ludopatía), manejo de comorbilidades'
        },
        'F63.0': {
            name: 'Ludopatía (juego patológico)',
            description: 'Comportamiento de juego persistente y recurrente',
            criteria: [
                'Preocupación por el juego',
                'Necesidad de apostar cantidades crecientes',
                'Intentos repetidos fallidos de controlar, reducir o detener el juego',
                'Inquietud o irritabilidad al intentar reducir',
                'Juega para escapar de problemas o aliviar disforia',
                'Vuelve a jugar tras perder dinero',
                'Miente para ocultar juego',
                'Ha puesto en peligro relaciones o trabajo',
                'Depende de otros para dinero'
            ],
            subcodes: [],
            treatment: 'TCC, Jugadores Anónimos, naltrexona, terapia familiar'
        },
        'F64': {
            name: 'Trastornos de la identidad de género',
            description: 'Identificación intensa y persistente con el sexo opuesto',
            criteria: [
                'Identificación intensa y persistente con sexo opuesto',
                'Malestar persistente con sexo asignado',
                'No hay condición intersexual física',
                'Malestar clínicamente significativo o deterioro'
            ],
            subcodes: ['F64.0 - Transexualismo', 'F64.1 - Transvestismo de rol dual', 'F64.2 - Trastorno de identidad de género en la niñez'],
            treatment: 'Psicoterapia de apoyo, terapia hormonal si apropiado, cirugía de reasignación en casos seleccionados'
        },
        'F65': {
            name: 'Trastornos de la preferencia sexual',
            description: 'Preferencias sexuales inusuales con malestar o deterioro',
            criteria: [
                'Fantasías, impulsos o comportamientos sexuales recurrentes',
                'Causan malestar significativo o deterioro',
                'Persisten por al menos 6 meses',
                'Pueden involucrar objetos no humanos, sufrimiento, niños o personas no consentidoras'
            ],
            subcodes: ['F65.0 - Fetichismo', 'F65.1 - Transvestismo fetichista', 'F65.2 - Exhibicionismo', 'F65.3 - Voyeurismo', 'F65.4 - Pedofilia', 'F65.5 - Sadomasoquismo'],
            treatment: 'Psicoterapia especializada, medicación anti-andrógena en casos específicos, TCC'
        },
        
        // F70-F79: Retraso mental
        'F70': {
            name: 'Retraso mental leve',
            description: 'Déficit intelectual con CI aproximado entre 50-69',
            criteria: [
                'CI aproximadamente 50-69',
                'Capacidad para trabajo que requiere habilidades prácticas',
                'Dificultades de aprendizaje en escuela',
                'Puede lograr independencia completa en cuidado personal',
                'Puede requerir apoyo en situaciones complejas'
            ],
            subcodes: ['F70.0 - Con mención de ausencia o deterioro mínimo del comportamiento', 'F70.1 - Con deterioro significativo del comportamiento'],
            treatment: 'Educación especial, entrenamiento vocacional, apoyo comunitario, terapia conductual'
        },
        'F71': {
            name: 'Retraso mental moderado',
            description: 'Déficit intelectual con CI aproximado entre 35-49',
            criteria: [
                'CI aproximadamente 35-49',
                'Lentitud marcada en desarrollo',
                'Puede aprender habilidades básicas de cuidado personal',
                'Capacidad limitada para tareas sin supervisión',
                'Requiere apoyo para vivir y trabajar'
            ],
            subcodes: ['F71.0 - Comportamiento mínimamente afectado', 'F71.1 - Deterioro significativo del comportamiento'],
            treatment: 'Educación especializada, entrenamiento en habilidades de vida, supervisión y apoyo continuos'
        },
        'F72': {
            name: 'Retraso mental grave',
            description: 'Déficit intelectual con CI aproximado entre 20-34',
            criteria: [
                'CI aproximadamente 20-34',
                'Desarrollo motor y lenguaje muy limitados',
                'Puede aprender habilidades muy básicas de autocuidado',
                'Requiere supervisión constante',
                'Comprensión y comunicación muy limitadas'
            ],
            subcodes: ['F72.0 - Comportamiento mínimamente afectado', 'F72.1 - Deterioro significativo del comportamiento'],
            treatment: 'Cuidado y supervisión constantes, fisioterapia, terapia ocupacional, apoyo familiar'
        },
        'F73': {
            name: 'Retraso mental profundo',
            description: 'Déficit intelectual con CI inferior a 20',
            criteria: [
                'CI inferior a 20',
                'Capacidad muy limitada para cuidado personal',
                'Movilidad muy restringida o inexistente',
                'Incontinencia',
                'Comunicación no verbal rudimentaria',
                'Requiere cuidado y supervisión totales'
            ],
            subcodes: ['F73.0 - Comportamiento mínimamente afectado', 'F73.1 - Deterioro significativo del comportamiento'],
            treatment: 'Cuidado total de enfermería, fisioterapia, prevención de complicaciones, apoyo familiar intensivo'
        },
        'F79': {
            name: 'Retraso mental sin especificación',
            description: 'Déficit intelectual sin información suficiente para determinar grado',
            criteria: [
                'Evidencia clara de retraso mental',
                'Información insuficiente para determinar nivel específico',
                'Puede deberse a déficits sensoriales, problemas conductuales severos u otras limitaciones'
            ],
            subcodes: [],
            treatment: 'Evaluación completa, intervención según necesidades identificadas'
        },
        
        // F80-F89: Trastornos del desarrollo psicológico
        'F80': {
            name: 'Trastornos específicos del desarrollo del habla y del lenguaje',
            description: 'Alteración del desarrollo normal de adquisición del lenguaje',
            criteria: [
                'Desarrollo del lenguaje significativamente por debajo de nivel esperado',
                'No debido a déficit intelectual, físico o neurológico',
                'Interferencia con rendimiento académico o comunicación social',
                'Inicio en desarrollo temprano'
            ],
            subcodes: ['F80.0 - Trastorno de articulación', 'F80.1 - Trastorno del lenguaje expresivo', 'F80.2 - Trastorno del lenguaje receptivo'],
            treatment: 'Terapia del lenguaje, intervención educativa, apoyo familiar'
        },
        'F81': {
            name: 'Trastornos específicos del desarrollo del aprendizaje escolar',
            description: 'Deterioro significativo del aprendizaje escolar no debido a retraso mental',
            criteria: [
                'Rendimiento sustancialmente por debajo de esperado para edad',
                'No debido a déficit sensorial o neurológico',
                'Interferencia significativa con rendimiento académico',
                'Presente desde etapas tempranas de educación'
            ],
            subcodes: ['F81.0 - Trastorno de lectura (dislexia)', 'F81.1 - Trastorno de cálculo (discalculia)', 'F81.2 - Trastorno de expresión escrita'],
            treatment: 'Educación especial, intervención específica según área afectada, apoyo psicopedagógico'
        },
        'F82': {
            name: 'Trastorno específico del desarrollo de la función motriz',
            description: 'Deterioro significativo del desarrollo de coordinación motora',
            criteria: [
                'Coordinación motora significativamente por debajo de nivel esperado',
                'No debido a condición médica general',
                'Interferencia con rendimiento académico o actividades cotidianas',
                'No cumple criterios para trastorno generalizado del desarrollo'
            ],
            subcodes: [],
            treatment: 'Fisioterapia, terapia ocupacional, ejercicios de coordinación, adaptaciones escolares'
        },
        'F84': {
            name: 'Trastornos generalizados del desarrollo',
            description: 'Grupo de trastornos con alteraciones cualitativas de interacción social y comunicación',
            criteria: [
                'Déficits en interacción social',
                'Déficits en comunicación',
                'Patrones restrictivos y repetitivos de comportamiento',
                'Inicio en desarrollo temprano',
                'Deterioro clínicamente significativo'
            ],
            subcodes: ['F84.0 - Autismo infantil', 'F84.1 - Autismo atípico', 'F84.5 - Síndrome de Asperger'],
            treatment: 'Intervención conductual intensiva temprana, terapia del habla, terapia ocupacional, apoyo educativo'
        },
        'F84.0': {
            name: 'Autismo infantil',
            description: 'Desarrollo anormal antes de los 3 años con alteración en interacción social, comunicación y comportamiento',
            criteria: [
                'Desarrollo anormal antes de 3 años',
                'Alteración cualitativa de interacción social',
                'Alteración cualitativa de comunicación',
                'Patrones de comportamiento, intereses y actividades restrictivos y repetitivos',
                'No explicado por otros trastornos del desarrollo'
            ],
            subcodes: [],
            treatment: 'Análisis conductual aplicado (ABA), TEACCH, intervención temprana intensiva, terapia del habla'
        },
        'F84.5': {
            name: 'Síndrome de Asperger',
            description: 'Trastorno con deterioro de interacción social y patrones restrictivos sin retraso del lenguaje',
            criteria: [
                'Deterioro cualitativo de interacción social',
                'Patrones restrictivos y repetitivos de comportamiento',
                'Deterioro clínicamente significativo',
                'Sin retraso clínicamente significativo del lenguaje',
                'Sin retraso del desarrollo cognitivo'
            ],
            subcodes: [],
            treatment: 'Entrenamiento en habilidades sociales, TCC, apoyo educativo, manejo de comorbilidades'
        },
        'F89': {
            name: 'Trastorno del desarrollo psicológico sin especificación',
            description: 'Trastorno del desarrollo sin información suficiente para diagnóstico específico',
            criteria: [
                'Alteración del desarrollo presente',
                'Información insuficiente para clasificación específica',
                'Requiere evaluación adicional'
            ],
            subcodes: [],
            treatment: 'Evaluación diagnóstica completa, intervención según necesidades identificadas'
        },
        
        // F90-F98: Trastornos del comportamiento y de las emociones de comienzo habitual en la infancia
        'F90': {
            name: 'Trastornos hipercinéticos',
            description: 'Trastornos con déficit de atención e hiperactividad',
            criteria: [
                'Inatención persistente',
                'Hiperactividad',
                'Impulsividad',
                'Inicio antes de los 7 años',
                'Presente en múltiples situaciones',
                'Deterioro funcional significativo'
            ],
            subcodes: ['F90.0 - Trastorno de la actividad y de la atención', 'F90.1 - Trastorno hipercinético disocial'],
            treatment: 'Metilfenidato u otros estimulantes, terapia conductual, intervenciones educativas, apoyo familiar'
        },
        'F91': {
            name: 'Trastornos disociales',
            description: 'Patrón repetitivo y persistente de comportamiento antisocial, agresivo o desafiante',
            criteria: [
                'Patrón de violación de normas sociales básicas',
                'Agresión a personas o animales',
                'Destrucción de propiedad',
                'Fraudulencia o robo',
                'Violaciones graves de reglas',
                'Duración al menos 6 meses'
            ],
            subcodes: ['F91.0 - Limitado al contexto familiar', 'F91.1 - No socializado', 'F91.2 - Socializado', 'F91.3 - Desafiante y oposicionista'],
            treatment: 'Terapia familiar, entrenamiento para padres, terapia cognitivo-conductual, intervención escolar'
        },
        'F92': {
            name: 'Trastornos mixtos de las emociones y del comportamiento',
            description: 'Combinación de síntomas depresivos/ansiosos con alteraciones conductuales',
            criteria: [
                'Síntomas emocionales presentes (ansiedad, depresión)',
                'Alteraciones conductuales presentes',
                'Ambos grupos de síntomas son significativos',
                'Deterioro funcional'
            ],
            subcodes: ['F92.0 - Trastorno depresivo de la conducta'],
            treatment: 'Psicoterapia combinada, manejo familiar, medicación según sintomatología'
        },
        'F93': {
            name: 'Trastornos de las emociones de comienzo habitual en la infancia',
            description: 'Trastornos emocionales específicos de la infancia',
            criteria: [
                'Ansiedad o temores inapropiados para edad',
                'Persistencia más allá de fase apropiada del desarrollo',
                'Deterioro funcional',
                'No parte de trastorno más generalizado'
            ],
            subcodes: ['F93.0 - Trastorno de ansiedad de separación', 'F93.1 - Trastorno de ansiedad fóbica', 'F93.2 - Trastorno de ansiedad social'],
            treatment: 'TCC adaptada a edad, terapia de juego, intervención familiar, ISRS si severo'
        },
        'F94': {
            name: 'Trastornos del comportamiento social de comienzo habitual en la infancia',
            description: 'Alteraciones del funcionamiento social con inicio en infancia',
            criteria: [
                'Alteración persistente del funcionamiento social',
                'Inicio en primeros 5 años de vida',
                'Presencia en múltiples contextos',
                'No debido a autismo'
            ],
            subcodes: ['F94.0 - Mutismo electivo', 'F94.1 - Trastorno de vinculación reactivo', 'F94.2 - Trastorno de vinculación desinhibido'],
            treatment: 'Psicoterapia, terapia familiar, ambiente estable y predecible, tratamiento de trauma si presente'
        },
        'F95': {
            name: 'Trastornos de tics',
            description: 'Movimientos o vocalizaciones súbitas, rápidas, recurrentes, no rítmicas',
            criteria: [
                'Tics motores o vocales presentes',
                'Tics ocurren muchas veces al día',
                'Presentes por más de 1 año',
                'Inicio antes de los 18 años',
                'No debido a sustancias o condición médica'
            ],
            subcodes: ['F95.0 - Trastorno de tics transitorios', 'F95.1 - Trastorno de tics motores o vocales crónicos', 'F95.2 - Síndrome de Tourette'],
            treatment: 'Terapia de reversión de hábitos, antipsicóticos en dosis bajas si severo, apoyo psicológico'
        },
        'F98': {
            name: 'Otros trastornos de las emociones y del comportamiento',
            description: 'Otros trastornos conductuales y emocionales de inicio en infancia',
            criteria: [
                'Alteración emocional o conductual presente',
                'Inicio típicamente en infancia',
                'No clasificable en categorías anteriores',
                'Deterioro funcional significativo'
            ],
            subcodes: ['F98.0 - Enuresis no orgánica', 'F98.1 - Encopresis no orgánica', 'F98.4 - Movimientos estereotipados'],
            treatment: 'Intervención conductual específica según síntoma, apoyo familiar, manejo de comorbilidades'
        },
        'F99': {
            name: 'Trastorno mental sin especificación',
            description: 'Trastorno mental presente pero sin información para clasificación específica',
            criteria: [
                'Evidencia de trastorno mental',
                'Información insuficiente para diagnóstico específico',
                'Requiere evaluación adicional'
            ],
            subcodes: [],
            treatment: 'Evaluación diagnóstica completa, tratamiento sintomático según presentación'
        }
    };

    // Si no hay detalles específicos, usar información genérica
    let details = codeDetails[code];
    if (!details) {
        details = {
            name: name,
            description: 'Información detallada no disponible para este código específico.',
            criteria: ['Consulte el manual CIE-10 oficial para criterios diagnósticos completos'],
            subcodes: [],
            treatment: 'Consulte con especialista para opciones de tratamiento'
        };
    }

    // Crear modal de detalles
    const detailModalId = 'codeDetailModal';
    let detailModal = document.getElementById(detailModalId);
    
    if (!detailModal) {
        detailModal = document.createElement('div');
        detailModal.id = detailModalId;
        detailModal.className = 'modal fade';
        detailModal.tabIndex = -1;
        detailModal.style.zIndex = '1060'; // Z-index más alto que el modal de capítulos
        detailModal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="codeDetailModalTitle"></h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="codeDetailModalBody">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" onclick="copyCodeDetailed('${code}')">
                            <i class="fas fa-copy me-1"></i>
                            Copiar Código
                        </button>
                        <button type="button" class="btn btn-outline-success" onclick="addToFavorites('${code}', '${name.replace(/'/g, "\\'")}')">
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
    document.getElementById('codeDetailModalTitle').innerHTML = `
        <i class="fas fa-info-circle me-2"></i>
        ${code} - ${details.name}
    `;
    
    const detailModalBody = document.getElementById('codeDetailModalBody');
    detailModalBody.innerHTML = `
        <div class="row">
            <div class="col-12">
                <div class="card border-0 bg-light mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-primary">
                            <i class="fas fa-file-medical me-2"></i>
                            Descripción
                        </h6>
                        <p class="card-text">${details.description}</p>
                    </div>
                </div>
                
                <div class="card border-0 bg-light mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-success">
                            <i class="fas fa-clipboard-list me-2"></i>
                            Criterios Diagnósticos
                        </h6>
                        <ul class="list-group list-group-flush">
                            ${details.criteria.map(criterion => `
                                <li class="list-group-item bg-transparent border-0 px-0">
                                    <i class="fas fa-check-circle text-success me-2"></i>
                                    ${criterion}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>

                ${details.subcodes.length > 0 ? `
                <div class="card border-0 bg-light mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-warning">
                            <i class="fas fa-sitemap me-2"></i>
                            Subcategorías
                        </h6>
                        <ul class="list-group list-group-flush">
                            ${details.subcodes.map(subcode => `
                                <li class="list-group-item bg-transparent border-0 px-0">
                                    <i class="fas fa-angle-right text-warning me-2"></i>
                                    <code class="text-primary">${subcode}</code>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
                ` : ''}

                <div class="card border-0 bg-light mb-3">
                    <div class="card-body">
                        <h6 class="card-title text-info">
                            <i class="fas fa-pills me-2"></i>
                            Tratamiento
                        </h6>
                        <p class="card-text">${details.treatment}</p>
                    </div>
                </div>

                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Nota Importante:</strong> Esta información es de referencia educativa. 
                    Siempre consulte el manual CIE-10 oficial y realice una evaluación clínica completa antes del diagnóstico.
                </div>
            </div>
        </div>
    `;

    // Mostrar modal de detalles
    const bootstrapDetailModal = new bootstrap.Modal(detailModal);
    
    // Ajustar z-index del backdrop cuando el modal se muestre
    detailModal.addEventListener('shown.bs.modal', function () {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        if (backdrops.length > 0) {
            const lastBackdrop = backdrops[backdrops.length - 1];
            lastBackdrop.style.zIndex = '1055'; // Un poco menos que el modal pero más que el modal de capítulos
        }
    }, { once: true });
    
    bootstrapDetailModal.show();
}

// Función para copiar código con detalles
function copyCodeDetailed(code) {
    const text = `Código CIE-10: ${code}`;
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

// Download CIE-10 manual
function downloadManual() {
    // URL del navegador oficial CIE-10 de la OMS
    const cie10BrowserUrl = 'https://icd.who.int/browse10/2019/en';
    
    // Mostrar mensaje
    showMessage('Abriendo navegador oficial CIE-10 de la OMS...', 'info');
    
    // Abrir en nueva pestaña
    window.open(cie10BrowserUrl, '_blank');
    
    // Mostrar mensaje de éxito
    setTimeout(() => {
        showMessage('Navegador CIE-10 abierto. Puede buscar y consultar todos los códigos en línea.', 'success');
    }, 1000);
}

/**
 * Muestra el historial de códigos CIE-10 consultados recientemente
 */
function showRecent() {
    // Obtener códigos del sistema de rastreo de uso
    const usageKey = 'cie10_code_usage';
    let usage = JSON.parse(localStorage.getItem(usageKey)) || {};
    
    // Convertir a array y ordenar por última fecha de uso
    const recentCodes = Object.values(usage)
        .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
        .slice(0, 20); // Últimos 20 códigos
    
    if (recentCodes.length === 0) {
        showMessage('No hay códigos recientes consultados', 'info');
        return;
    }
    
    // Crear modal con historial
    const modalHtml = `
        <div class="modal fade" id="recentCodesModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-history me-2"></i>
                            Códigos Consultados Recientemente
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted mb-3">
                            <i class="fas fa-info-circle me-2"></i>
                            Historial de los últimos ${recentCodes.length} códigos consultados
                        </p>
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="table-light">
                                    <tr>
                                        <th style="width: 15%;">Código</th>
                                        <th style="width: 50%;">Descripción</th>
                                        <th style="width: 15%;">Consultas</th>
                                        <th style="width: 20%;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${recentCodes.map((code, index) => {
                                        const lastUsedDate = new Date(code.lastUsed);
                                        const timeAgo = getTimeAgo(lastUsedDate);
                                        return `
                                        <tr>
                                            <td><strong class="text-primary">${code.code}</strong></td>
                                            <td>
                                                <div>${code.name}</div>
                                                <small class="text-muted">
                                                    <i class="fas fa-clock me-1"></i>${timeAgo}
                                                </small>
                                            </td>
                                            <td>
                                                <span class="badge bg-info">${code.count} ${code.count === 1 ? 'vez' : 'veces'}</span>
                                            </td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary me-1" onclick="showCodeDetails('${code.code}', '${code.name.replace(/'/g, "\\'")}', '')" data-bs-dismiss="modal">
                                                    <i class="fas fa-info-circle"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-secondary" onclick="copyCode('${code.code}')">
                                                    <i class="fas fa-copy"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-danger" onclick="clearRecentCodes()">
                            <i class="fas fa-trash me-1"></i>Limpiar Historial
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const existingModal = document.getElementById('recentCodesModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('recentCodesModal'));
    modal.show();
}

/**
 * Función auxiliar para calcular tiempo transcurrido
 */
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Hace un momento';
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} minutos`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} horas`;
    if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)} días`;
    if (seconds < 2592000) return `Hace ${Math.floor(seconds / 604800)} semanas`;
    return `Hace ${Math.floor(seconds / 2592000)} meses`;
}

/**
 * Limpia el historial de códigos recientes
 */
function clearRecentCodes() {
    if (confirm('¿Está seguro de que desea limpiar todo el historial de códigos consultados?')) {
        localStorage.removeItem('cie10_code_usage');
        
        // Cerrar modal
        const modal = document.getElementById('recentCodesModal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        }
        
        // Recargar códigos más usados
        if (window.cie10Manager) {
            window.cie10Manager.loadMostUsedCodes();
        }
        
        showMessage('Historial limpiado correctamente', 'success');
    }
}

function showMessage(message, type = 'info') {
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