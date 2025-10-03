// Test Psicométricos - PsiquiApp
// Sistema completo de evaluaciones psicológicas con normas de puntuación

class PsychometricTestManager {
    constructor() {
        this.currentTest = null;
        this.currentQuestionIndex = 0;
        this.responses = {};
        this.testResults = [];
        
        // Cargar resultados previos del localStorage
        this.loadPreviousResults();
        
        this.initializeEventListeners();
        this.loadTestLibrary();
    }
    
    loadPreviousResults() {
        try {
            const savedResults = localStorage.getItem('psychometric_results');
            if (savedResults) {
                this.testResults = JSON.parse(savedResults);
                
                // Eliminar duplicados basados en ID
                const uniqueResults = [];
                const seenIds = new Set();
                
                for (const result of this.testResults) {
                    if (!seenIds.has(result.id)) {
                        seenIds.add(result.id);
                        uniqueResults.push(result);
                    } else {
                        console.warn(`⚠️ Duplicado eliminado: ID ${result.id}`);
                    }
                }
                
                this.testResults = uniqueResults;
                
                // Si se eliminaron duplicados, actualizar localStorage
                if (uniqueResults.length < this.testResults.length) {
                    localStorage.setItem('psychometric_results', JSON.stringify(this.testResults));
                }
                
                console.log(`✅ Cargados ${this.testResults.length} resultados únicos`);
            }
        } catch (error) {
            console.error('Error cargando resultados previos:', error);
            this.testResults = [];
        }
    }

    initializeEventListeners() {
        // Event listeners para navegación y controles
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('start-test-btn')) {
                this.startTest(e.target.dataset.testId);
            }
            
            // Botón siguiente pregunta - con debugging
            if (e.target.matches('.next-question-btn') || e.target.closest('.next-question-btn')) {
                e.preventDefault();
                console.log('Botón siguiente presionado');
                this.nextQuestion();
            }
            
            // Botón pregunta anterior - con debugging
            if (e.target.matches('.prev-question-btn') || e.target.closest('.prev-question-btn')) {
                e.preventDefault();
                console.log('Botón anterior presionado');
                this.previousQuestion();
            }
            
            // Botón finalizar test - con mayor especificidad y debugging
            if (e.target.matches('.finish-test-btn') || e.target.closest('.finish-test-btn')) {
                e.preventDefault();
                console.log('Botón finalizar presionado');
                this.finishTest();
            }
            
            if (e.target.classList.contains('view-results-btn')) {
                this.viewResults(e.target.dataset.resultId);
            }
        });

        // Event delegation para respuestas de radio buttons
        document.addEventListener('change', (e) => {
            // Verificar si es un radio button de pregunta del test
            if (e.target.type === 'radio' && e.target.name && e.target.name.startsWith('question_')) {
                console.log('Radio button detectado:', e.target.name, 'valor:', e.target.value);
                
                if (this.currentTest && this.currentTest.questions) {
                    const questionId = this.currentTest.questions[this.currentQuestionIndex].id;
                    const responseValue = parseInt(e.target.value);
                    this.responses[questionId] = responseValue;
                    
                    // DEBUG: Información sobre las respuestas guardadas
                    console.log(`DEBUG respuesta guardada: Pregunta ${questionId} = ${responseValue}`);
                    console.log(`Total respuestas guardadas hasta ahora:`, Object.keys(this.responses).length);
                    console.log(`Respuestas completas:`, this.responses);
                    console.log(`Verificación - this.responses[${questionId}]:`, this.responses[questionId]);
                    
                    // Feedback visual inmediato y mejorado
                    const selectedOption = e.target.closest('.option-item');
                    const allOptions = document.querySelectorAll('.option-item');
                    
                    // Remover selección previa y restaurar bordes
                    allOptions.forEach(opt => {
                        opt.classList.remove('selected');
                        const optionContent = opt.querySelector('.option-content');
                        if (optionContent) {
                            optionContent.style.borderColor = '#e9ecef';
                            optionContent.style.borderWidth = '1px';
                            optionContent.style.background = '';
                            optionContent.style.transform = '';
                        }
                    });
                    
                    // Agregar selección actual con efecto visual mejorado
                    if (selectedOption) {
                        selectedOption.classList.add('selected');
                        const optionContent = selectedOption.querySelector('.option-content');
                        if (optionContent) {
                            optionContent.style.borderColor = 'var(--psiqui-primary)';
                            optionContent.style.borderWidth = '2px';
                            optionContent.style.background = 'linear-gradient(135deg, var(--psiqui-light), #f8f9fa)';
                            optionContent.style.transform = 'scale(1.02)';
                            optionContent.style.transition = 'all 0.3s ease';
                            
                            // Efecto de confirmación temporal
                            setTimeout(() => {
                                if (optionContent) {
                                    optionContent.style.animation = 'pulse 0.5s ease';
                                }
                            }, 100);
                        }
                    }
                    
                    // Ocultar el texto de advertencia
                    const warningText = document.querySelector('.response-required-warning');
                    if (warningText) {
                        warningText.style.opacity = '0';
                        warningText.style.transform = 'translateY(-10px)';
                        warningText.style.transition = 'all 0.3s ease';
                    }
                    
                    // Remover cualquier indicador de error previo
                    const existingIndicator = document.querySelector('.missing-response-indicator');
                    if (existingIndicator) {
                        existingIndicator.style.animation = 'fadeOut 0.3s ease';
                        setTimeout(() => {
                            if (existingIndicator.parentNode) {
                                existingIndicator.remove();
                            }
                        }, 300);
                    }
                    
                    // Actualizar navegación
                    this.updateNavigationButtons();
                }
            }
        });
    }

    // Base de datos de tests psicométricos con preguntas reales y normas
    getTestDatabase() {
        return {
            phq9: {
                id: 'phq9',
                name: 'PHQ-9 - Cuestionario de Salud del Paciente',
                description: 'Evaluación de síntomas depresivos en las últimas 2 semanas',
                duration: '5-10 minutos',
                category: 'Depresión',
                icon: 'fas fa-cloud-rain',
                color: 'info',
                instructions: 'Durante las últimas 2 semanas, ¿qué tan seguido ha tenido molestias debido a cualquiera de los siguientes problemas?',
                questions: [
                    {
                        id: 1,
                        text: '¿Poco interés o placer en hacer cosas?',
                        options: [
                            { value: 0, text: 'Para nada' },
                            { value: 1, text: 'Varios días' },
                            { value: 2, text: 'Más de la mitad de los días' },
                            { value: 3, text: 'Casi todos los días' }
                        ]
                    },
                    {
                        id: 2,
                        text: '¿Se ha sentido decaído(a), deprimido(a) o sin esperanzas?',
                        options: [
                            { value: 0, text: 'Para nada' },
                            { value: 1, text: 'Varios días' },
                            { value: 2, text: 'Más de la mitad de los días' },
                            { value: 3, text: 'Casi todos los días' }
                        ]
                    },
                    {
                        id: 3,
                        text: '¿Dificultad para quedarse o permanecer dormido(a), o dormir demasiado?',
                        options: [
                            { value: 0, text: 'Para nada' },
                            { value: 1, text: 'Varios días' },
                            { value: 2, text: 'Más de la mitad de los días' },
                            { value: 3, text: 'Casi todos los días' }
                        ]
                    },
                    {
                        id: 4,
                        text: '¿Cansancio o falta de energía?',
                        options: [
                            { value: 0, text: 'Para nada' },
                            { value: 1, text: 'Varios días' },
                            { value: 2, text: 'Más de la mitad de los días' },
                            { value: 3, text: 'Casi todos los días' }
                        ]
                    },
                    {
                        id: 5,
                        text: '¿Falta de apetito o comer en exceso?',
                        options: [
                            { value: 0, text: 'Para nada' },
                            { value: 1, text: 'Varios días' },
                            { value: 2, text: 'Más de la mitad de los días' },
                            { value: 3, text: 'Casi todos los días' }
                        ]
                    },
                    {
                        id: 6,
                        text: '¿Sentirse mal acerca de sí mismo(a) - o que es un fracaso o que ha quedado mal con usted mismo(a) o con su familia?',
                        options: [
                            { value: 0, text: 'Para nada' },
                            { value: 1, text: 'Varios días' },
                            { value: 2, text: 'Más de la mitad de los días' },
                            { value: 3, text: 'Casi todos los días' }
                        ]
                    },
                    {
                        id: 7,
                        text: '¿Dificultad para concentrarse en cosas tales como leer el periódico o ver televisión?',
                        options: [
                            { value: 0, text: 'Para nada' },
                            { value: 1, text: 'Varios días' },
                            { value: 2, text: 'Más de la mitad de los días' },
                            { value: 3, text: 'Casi todos los días' }
                        ]
                    },
                    {
                        id: 8,
                        text: '¿Moverse o hablar tan lento que otras personas podrían notarlo? ¿O lo contrario - estar tan inquieto(a) o agitado(a) que se ha estado moviendo mucho más de lo normal?',
                        options: [
                            { value: 0, text: 'Para nada' },
                            { value: 1, text: 'Varios días' },
                            { value: 2, text: 'Más de la mitad de los días' },
                            { value: 3, text: 'Casi todos los días' }
                        ]
                    },
                    {
                        id: 9,
                        text: '¿Pensamientos de que estaría mejor muerto(a) o de lastimarse de alguna manera?',
                        options: [
                            { value: 0, text: 'Para nada' },
                            { value: 1, text: 'Varios días' },
                            { value: 2, text: 'Más de la mitad de los días' },
                            { value: 3, text: 'Casi todos los días' }
                        ]
                    }
                ],
                scoring: {
                    method: 'sum',
                    interpretation: [
                        { range: [0, 4], level: 'Mínima', description: 'Síntomas mínimos de depresión', color: 'success' },
                        { range: [5, 9], level: 'Leve', description: 'Depresión leve', color: 'warning' },
                        { range: [10, 14], level: 'Moderada', description: 'Depresión moderada', color: 'orange' },
                        { range: [15, 19], level: 'Moderadamente severa', description: 'Depresión moderadamente severa', color: 'danger' },
                        { range: [20, 27], level: 'Severa', description: 'Depresión severa', color: 'dark' }
                    ]
                }
            },
            gad7: {
                id: 'gad7',
                name: 'GAD-7 - Escala de Ansiedad Generalizada',
                description: 'Evaluación de síntomas de ansiedad en las últimas 2 semanas',
                duration: '5 minutos',
                category: 'Ansiedad',
                icon: 'fas fa-heartbeat',
                color: 'warning',
                instructions: 'Durante las últimas 2 semanas, ¿qué tan seguido ha sido molestado por los siguientes problemas?',
                questions: [
                    {
                        id: 1,
                        text: '¿Sentirse nervioso, ansioso o muy alterado?',
                        options: [
                            { value: 0, text: 'Para nada' },
                            { value: 1, text: 'Varios días' },
                            { value: 2, text: 'Más de la mitad de los días' },
                            { value: 3, text: 'Casi todos los días' }
                        ]
                    },
                    {
                        id: 2,
                        text: '¿No ser capaz de parar o controlar la preocupación?',
                        options: [
                            { value: 0, text: 'Para nada' },
                            { value: 1, text: 'Varios días' },
                            { value: 2, text: 'Más de la mitad de los días' },
                            { value: 3, text: 'Casi todos los días' }
                        ]
                    },
                    {
                        id: 3,
                        text: '¿Preocuparse demasiado por diferentes cosas?',
                        options: [
                            { value: 0, text: 'Para nada' },
                            { value: 1, text: 'Varios días' },
                            { value: 2, text: 'Más de la mitad de los días' },
                            { value: 3, text: 'Casi todos los días' }
                        ]
                    },
                    {
                        id: 4,
                        text: '¿Dificultad para relajarse?',
                        options: [
                            { value: 0, text: 'Para nada' },
                            { value: 1, text: 'Varios días' },
                            { value: 2, text: 'Más de la mitad de los días' },
                            { value: 3, text: 'Casi todos los días' }
                        ]
                    },
                    {
                        id: 5,
                        text: '¿Estar tan inquieto que es difícil quedarse quieto?',
                        options: [
                            { value: 0, text: 'Para nada' },
                            { value: 1, text: 'Varios días' },
                            { value: 2, text: 'Más de la mitad de los días' },
                            { value: 3, text: 'Casi todos los días' }
                        ]
                    },
                    {
                        id: 6,
                        text: '¿Irritarse o enojarse fácilmente?',
                        options: [
                            { value: 0, text: 'Para nada' },
                            { value: 1, text: 'Varios días' },
                            { value: 2, text: 'Más de la mitad de los días' },
                            { value: 3, text: 'Casi todos los días' }
                        ]
                    },
                    {
                        id: 7,
                        text: '¿Tener miedo de que algo terrible pueda pasar?',
                        options: [
                            { value: 0, text: 'Para nada' },
                            { value: 1, text: 'Varios días' },
                            { value: 2, text: 'Más de la mitad de los días' },
                            { value: 3, text: 'Casi todos los días' }
                        ]
                    }
                ],
                scoring: {
                    method: 'sum',
                    interpretation: [
                        { range: [0, 4], level: 'Mínima', description: 'Ansiedad mínima', color: 'success' },
                        { range: [5, 9], level: 'Leve', description: 'Ansiedad leve', color: 'warning' },
                        { range: [10, 14], level: 'Moderada', description: 'Ansiedad moderada', color: 'orange' },
                        { range: [15, 21], level: 'Severa', description: 'Ansiedad severa', color: 'danger' }
                    ]
                }
            },
            beck_depression: {
                id: 'beck_depression',
                name: 'BDI-II - Inventario de Depresión de Beck',
                description: 'Evaluación detallada de síntomas depresivos',
                duration: '10-15 minutos',
                category: 'Depresión',
                icon: 'fas fa-brain',
                color: 'primary',
                instructions: 'Este cuestionario consiste en 21 grupos de afirmaciones. Lea cuidadosamente cada grupo y seleccione la afirmación que mejor describa cómo se ha sentido durante las últimas dos semanas, incluyendo hoy.',
                questions: [
                    {
                        id: 1,
                        text: 'Tristeza',
                        options: [
                            { value: 0, text: 'No me siento triste' },
                            { value: 1, text: 'Me siento triste gran parte del tiempo' },
                            { value: 2, text: 'Estoy triste todo el tiempo' },
                            { value: 3, text: 'Estoy tan triste o soy tan infeliz que no puedo soportarlo' }
                        ]
                    },
                    {
                        id: 2,
                        text: 'Pesimismo',
                        options: [
                            { value: 0, text: 'No estoy desalentado respecto del futuro' },
                            { value: 1, text: 'Me siento más desalentado respecto del futuro que lo que solía sentirme' },
                            { value: 2, text: 'No espero que las cosas funcionen para mí' },
                            { value: 3, text: 'Siento que no hay esperanza para mi futuro y que sólo puede empeorar' }
                        ]
                    },
                    {
                        id: 3,
                        text: 'Fracaso',
                        options: [
                            { value: 0, text: 'No me siento como un fracaso' },
                            { value: 1, text: 'He fracasado más de lo que hubiera debido' },
                            { value: 2, text: 'Cuando miro hacia atrás, veo muchos fracasos' },
                            { value: 3, text: 'Siento que como persona soy un fracaso total' }
                        ]
                    },
                    {
                        id: 4,
                        text: 'Pérdida de Placer',
                        options: [
                            { value: 0, text: 'Obtengo tanto placer como siempre por las cosas de las que disfruto' },
                            { value: 1, text: 'No disfruto tanto de las cosas como solía hacerlo' },
                            { value: 2, text: 'Obtengo muy poco placer de las cosas que solía disfrutar' },
                            { value: 3, text: 'No puedo obtener ningún placer de las cosas de las que solía disfrutar' }
                        ]
                    },
                    {
                        id: 5,
                        text: 'Sentimientos de Culpa',
                        options: [
                            { value: 0, text: 'No me siento particularmente culpable' },
                            { value: 1, text: 'Me siento culpable respecto de varias cosas que he hecho o que debería haber hecho' },
                            { value: 2, text: 'Me siento bastante culpable la mayor parte del tiempo' },
                            { value: 3, text: 'Me siento culpable todo el tiempo' }
                        ]
                    }
                ],
                scoring: {
                    method: 'sum',
                    interpretation: [
                        { range: [0, 13], level: 'Mínima', description: 'Depresión mínima', color: 'success' },
                        { range: [14, 19], level: 'Leve', description: 'Depresión leve', color: 'warning' },
                        { range: [20, 28], level: 'Moderada', description: 'Depresión moderada', color: 'orange' },
                        { range: [29, 63], level: 'Severa', description: 'Depresión severa', color: 'danger' }
                    ]
                }
            },
            mini_mental: {
                id: 'mini_mental',
                name: 'MMSE - Mini Examen del Estado Mental',
                description: 'Evaluación rápida de función cognitiva',
                duration: '10 minutos',
                category: 'Cognitivo',
                icon: 'fas fa-brain',
                color: 'success',
                instructions: 'Este test evalúa diferentes aspectos de la función cognitiva. Responda lo mejor que pueda a cada pregunta.',
                questions: [
                    {
                        id: 1,
                        text: 'Orientación temporal: ¿En qué año estamos?',
                        type: 'cognitive',
                        correctAnswer: new Date().getFullYear(),
                        options: [
                            { value: 1, text: 'Respuesta correcta' },
                            { value: 0, text: 'Respuesta incorrecta' }
                        ]
                    },
                    {
                        id: 2,
                        text: 'Orientación temporal: ¿En qué estación del año estamos?',
                        type: 'cognitive',
                        options: [
                            { value: 1, text: 'Respuesta correcta' },
                            { value: 0, text: 'Respuesta incorrecta' }
                        ]
                    },
                    {
                        id: 3,
                        text: 'Orientación temporal: ¿En qué mes estamos?',
                        type: 'cognitive',
                        options: [
                            { value: 1, text: 'Respuesta correcta' },
                            { value: 0, text: 'Respuesta incorrecta' }
                        ]
                    },
                    {
                        id: 4,
                        text: 'Orientación espacial: ¿En qué país estamos?',
                        type: 'cognitive',
                        options: [
                            { value: 1, text: 'Respuesta correcta' },
                            { value: 0, text: 'Respuesta incorrecta' }
                        ]
                    },
                    {
                        id: 5,
                        text: 'Registro: Repita estas tres palabras: PELOTA, BANDERA, ÁRBOL',
                        type: 'cognitive',
                        options: [
                            { value: 3, text: 'Repitió las 3 palabras correctamente' },
                            { value: 2, text: 'Repitió 2 palabras correctamente' },
                            { value: 1, text: 'Repitió 1 palabra correctamente' },
                            { value: 0, text: 'No pudo repetir ninguna palabra' }
                        ]
                    }
                ],
                scoring: {
                    method: 'sum',
                    maxScore: 30,
                    interpretation: [
                        { range: [24, 30], level: 'Normal', description: 'Función cognitiva normal', color: 'success' },
                        { range: [18, 23], level: 'Deterioro leve', description: 'Deterioro cognitivo leve', color: 'warning' },
                        { range: [0, 17], level: 'Deterioro severo', description: 'Deterioro cognitivo severo', color: 'danger' }
                    ]
                }
            },
            beck_anxiety: {
                id: 'beck_anxiety',
                name: 'BAI - Inventario de Ansiedad de Beck',
                description: 'Evaluación de síntomas físicos de ansiedad',
                duration: '5-10 minutos',
                category: 'Ansiedad',
                icon: 'fas fa-heartbeat',
                color: 'warning',
                instructions: 'A continuación encontrará una lista de síntomas comunes de ansiedad. Indique cuánto le ha molestado cada síntoma durante la última semana, incluyendo hoy.',
                questions: [
                    {
                        id: 1,
                        text: 'Entumecimiento u hormigueo',
                        options: [
                            { value: 0, text: 'En absoluto' },
                            { value: 1, text: 'Levemente, no me molesta mucho' },
                            { value: 2, text: 'Moderadamente, fue muy desagradable pero pude soportarlo' },
                            { value: 3, text: 'Severamente, casi no pude soportarlo' }
                        ]
                    },
                    {
                        id: 2,
                        text: 'Sensación de calor',
                        options: [
                            { value: 0, text: 'En absoluto' },
                            { value: 1, text: 'Levemente, no me molesta mucho' },
                            { value: 2, text: 'Moderadamente, fue muy desagradable pero pude soportarlo' },
                            { value: 3, text: 'Severamente, casi no pude soportarlo' }
                        ]
                    },
                    {
                        id: 3,
                        text: 'Temblor en las piernas',
                        options: [
                            { value: 0, text: 'En absoluto' },
                            { value: 1, text: 'Levemente, no me molesta mucho' },
                            { value: 2, text: 'Moderadamente, fue muy desagradable pero pude soportarlo' },
                            { value: 3, text: 'Severamente, casi no pude soportarlo' }
                        ]
                    },
                    {
                        id: 4,
                        text: 'Incapaz de relajarse',
                        options: [
                            { value: 0, text: 'En absoluto' },
                            { value: 1, text: 'Levemente, no me molesta mucho' },
                            { value: 2, text: 'Moderadamente, fue muy desagradable pero pude soportarlo' },
                            { value: 3, text: 'Severamente, casi no pude soportarlo' }
                        ]
                    },
                    {
                        id: 5,
                        text: 'Miedo a que ocurra lo peor',
                        options: [
                            { value: 0, text: 'En absoluto' },
                            { value: 1, text: 'Levemente, no me molesta mucho' },
                            { value: 2, text: 'Moderadamente, fue muy desagradable pero pude soportarlo' },
                            { value: 3, text: 'Severamente, casi no pude soportarlo' }
                        ]
                    }
                ],
                scoring: {
                    method: 'sum',
                    interpretation: [
                        { range: [0, 7], level: 'Mínima', description: 'Ansiedad mínima', color: 'success' },
                        { range: [8, 15], level: 'Leve', description: 'Ansiedad leve', color: 'warning' },
                        { range: [16, 25], level: 'Moderada', description: 'Ansiedad moderada', color: 'orange' },
                        { range: [26, 63], level: 'Severa', description: 'Ansiedad severa', color: 'danger' }
                    ]
                }
            },
            moca: {
                id: 'moca',
                name: 'MoCA - Evaluación Cognitiva de Montreal',
                description: 'Detección de deterioro cognitivo leve',
                duration: '10-15 minutos',
                category: 'Cognitivo',
                icon: 'fas fa-brain',
                color: 'success',
                instructions: 'Esta evaluación examina diferentes aspectos de la función cognitiva. Por favor responda lo mejor que pueda.',
                questions: [
                    {
                        id: 1,
                        text: 'Función visuoespacial: ¿Puede copiar correctamente un cubo?',
                        type: 'cognitive',
                        options: [
                            { value: 1, text: 'Sí, copia correctamente' },
                            { value: 0, text: 'No puede copiar correctamente' }
                        ]
                    },
                    {
                        id: 2,
                        text: 'Denominación: ¿Puede nombrar correctamente: león, rinoceronte, camello?',
                        type: 'cognitive',
                        options: [
                            { value: 3, text: 'Nombra los 3 animales correctamente' },
                            { value: 2, text: 'Nombra 2 animales correctamente' },
                            { value: 1, text: 'Nombra 1 animal correctamente' },
                            { value: 0, text: 'No puede nombrar ningún animal' }
                        ]
                    },
                    {
                        id: 3,
                        text: 'Memoria: Recuerde estas palabras: ROSTRO, SEDA, IGLESIA, CLAVEL, ROJO',
                        type: 'cognitive',
                        options: [
                            { value: 5, text: 'Recuerda las 5 palabras' },
                            { value: 4, text: 'Recuerda 4 palabras' },
                            { value: 3, text: 'Recuerda 3 palabras' },
                            { value: 2, text: 'Recuerda 2 palabras' },
                            { value: 1, text: 'Recuerda 1 palabra' },
                            { value: 0, text: 'No recuerda ninguna palabra' }
                        ]
                    },
                    {
                        id: 4,
                        text: 'Atención: Repetir secuencia de números hacia adelante: 2-1-8-5-4',
                        type: 'cognitive',
                        options: [
                            { value: 1, text: 'Repite correctamente' },
                            { value: 0, text: 'No puede repetir correctamente' }
                        ]
                    },
                    {
                        id: 5,
                        text: 'Lenguaje: Repetir: "El gato siempre se esconde bajo el sofá cuando llegan perros"',
                        type: 'cognitive',
                        options: [
                            { value: 2, text: 'Repite perfectamente' },
                            { value: 1, text: 'Repite con 1-2 errores menores' },
                            { value: 0, text: 'No puede repetir correctamente' }
                        ]
                    }
                ],
                scoring: {
                    method: 'sum',
                    maxScore: 30,
                    interpretation: [
                        { range: [26, 30], level: 'Normal', description: 'Función cognitiva normal', color: 'success' },
                        { range: [18, 25], level: 'Deterioro leve', description: 'Posible deterioro cognitivo leve', color: 'warning' },
                        { range: [10, 17], level: 'Deterioro moderado', description: 'Deterioro cognitivo moderado', color: 'orange' },
                        { range: [0, 9], level: 'Deterioro severo', description: 'Deterioro cognitivo severo', color: 'danger' }
                    ]
                }
            },
            audit: {
                id: 'audit',
                name: 'AUDIT - Test de Identificación de Trastornos por Alcohol',
                description: 'Screening para problemas con el alcohol',
                duration: '5 minutos',
                category: 'Adicciones',
                icon: 'fas fa-wine-glass',
                color: 'danger',
                instructions: 'Las siguientes preguntas se refieren a su consumo de alcohol. Por favor responda honestamente.',
                questions: [
                    {
                        id: 1,
                        text: '¿Con qué frecuencia consume bebidas alcohólicas?',
                        options: [
                            { value: 0, text: 'Nunca' },
                            { value: 1, text: 'Una vez al mes o menos' },
                            { value: 2, text: 'De 2 a 4 veces al mes' },
                            { value: 3, text: 'De 2 a 3 veces por semana' },
                            { value: 4, text: '4 o más veces por semana' }
                        ]
                    },
                    {
                        id: 2,
                        text: '¿Cuántas bebidas alcohólicas consume en un día típico cuando bebe?',
                        options: [
                            { value: 0, text: '1 o 2' },
                            { value: 1, text: '3 o 4' },
                            { value: 2, text: '5 o 6' },
                            { value: 3, text: '7, 8 o 9' },
                            { value: 4, text: '10 o más' }
                        ]
                    },
                    {
                        id: 3,
                        text: '¿Con qué frecuencia toma 6 o más bebidas en una sola ocasión?',
                        options: [
                            { value: 0, text: 'Nunca' },
                            { value: 1, text: 'Menos de una vez al mes' },
                            { value: 2, text: 'Mensualmente' },
                            { value: 3, text: 'Semanalmente' },
                            { value: 4, text: 'A diario o casi a diario' }
                        ]
                    }
                ],
                scoring: {
                    method: 'sum',
                    interpretation: [
                        { range: [0, 7], level: 'Bajo riesgo', description: 'Consumo de bajo riesgo', color: 'success' },
                        { range: [8, 15], level: 'Riesgo', description: 'Consumo de riesgo', color: 'warning' },
                        { range: [16, 19], level: 'Uso perjudicial', description: 'Uso perjudicial del alcohol', color: 'orange' },
                        { range: [20, 40], level: 'Dependencia', description: 'Probable dependencia alcohólica', color: 'danger' }
                    ]
                }
            },
            
            // Escalas de Depresión Adicionales
            hamilton_depression: {
                id: 'hamilton_depression',
                name: 'Escala de Depresión de Hamilton (HAM-D)',
                description: 'Evaluación clínica de la severidad de la depresión',
                duration: '15-20 minutos',
                category: 'Depresión',
                icon: 'fas fa-chart-line',
                color: 'info',
                instructions: 'Esta escala debe ser administrada por un clínico. Evalúe cada ítem basándose en la entrevista clínica y observación.',
                questions: [
                    {
                        id: 1,
                        text: 'Estado de ánimo deprimido (tristeza, desesperanza, desamparo, sentimientos de inutilidad)',
                        options: [
                            { value: 0, text: 'Ausente' },
                            { value: 1, text: 'Estas sensaciones se indican solamente al ser preguntado' },
                            { value: 2, text: 'Estas sensaciones se relatan espontáneamente' },
                            { value: 3, text: 'Sensaciones no comunicadas verbalmente sino por expresión facial, postura, voz y tendencia al llanto' },
                            { value: 4, text: 'El paciente manifiesta estas sensaciones en su comunicación verbal y no verbal de forma espontánea' }
                        ]
                    },
                    {
                        id: 2,
                        text: 'Sentimientos de culpabilidad',
                        options: [
                            { value: 0, text: 'Ausente' },
                            { value: 1, text: 'Se culpa a sí mismo, cree haber decepcionado a la gente' },
                            { value: 2, text: 'Ideas de culpabilidad o meditación sobre errores pasados o malas acciones' },
                            { value: 3, text: 'La enfermedad actual es un castigo. Ideas delirantes de culpabilidad' },
                            { value: 4, text: 'Oye voces acusatorias o de denuncia y/o experimenta alucinaciones visuales amenazadoras' }
                        ]
                    },
                    {
                        id: 3,
                        text: 'Ideación suicida',
                        options: [
                            { value: 0, text: 'Ausente' },
                            { value: 1, text: 'Le parece que no vale la pena vivir' },
                            { value: 2, text: 'Desearía estar muerto o tiene pensamientos sobre la posibilidad de morirse' },
                            { value: 3, text: 'Ideas suicidas o amenazas' },
                            { value: 4, text: 'Tentativas suicidas (cualquier tentativa seria se califica 4)' }
                        ]
                    },
                    {
                        id: 4,
                        text: 'Insomnio inicial',
                        options: [
                            { value: 0, text: 'No hay dificultad para conciliar el sueño' },
                            { value: 1, text: 'Dificultad ocasional para conciliar el sueño (más de media hora)' },
                            { value: 2, text: 'Dificultad para conciliar el sueño cada noche' }
                        ]
                    },
                    {
                        id: 5,
                        text: 'Insomnio intermedio',
                        options: [
                            { value: 0, text: 'No hay dificultad' },
                            { value: 1, text: 'El paciente se queja de estar inquieto durante la noche' },
                            { value: 2, text: 'Está despierto durante la noche; cualquier ocasión de levantarse de la cama se califica 2' }
                        ]
                    }
                ],
                scoring: {
                    method: 'sum',
                    maxScore: 52,
                    interpretation: [
                        { range: [0, 7], level: 'Normal', description: 'No depresión', color: 'success' },
                        { range: [8, 13], level: 'Leve', description: 'Depresión leve', color: 'warning' },
                        { range: [14, 18], level: 'Moderada', description: 'Depresión moderada', color: 'orange' },
                        { range: [19, 22], level: 'Severa', description: 'Depresión severa', color: 'danger' },
                        { range: [23, 52], level: 'Muy severa', description: 'Depresión muy severa', color: 'dark' }
                    ]
                }
            },

            // Escalas de Ansiedad Adicionales
            hamilton_anxiety: {
                id: 'hamilton_anxiety',
                name: 'Escala de Ansiedad de Hamilton (HAM-A)',
                description: 'Evaluación clínica de la severidad de la ansiedad',
                duration: '15-20 minutos',
                category: 'Ansiedad',
                icon: 'fas fa-heartbeat',
                color: 'warning',
                instructions: 'Escala de heteroaplicación para evaluar la intensidad de la ansiedad.',
                questions: [
                    {
                        id: 1,
                        text: 'Estado ansioso: Inquietud, expectativas de catástrofe, aprensión, irritabilidad',
                        options: [
                            { value: 0, text: 'No presente' },
                            { value: 1, text: 'Leve' },
                            { value: 2, text: 'Moderado' },
                            { value: 3, text: 'Severo' },
                            { value: 4, text: 'Muy severo' }
                        ]
                    },
                    {
                        id: 2,
                        text: 'Tensión: Sensación de tensión, fatigabilidad, sobresalto, llanto fácil, temblores, incapacidad de relajarse',
                        options: [
                            { value: 0, text: 'No presente' },
                            { value: 1, text: 'Leve' },
                            { value: 2, text: 'Moderado' },
                            { value: 3, text: 'Severo' },
                            { value: 4, text: 'Muy severo' }
                        ]
                    },
                    {
                        id: 3,
                        text: 'Temores: A la oscuridad, a los desconocidos, a quedarse solo, a los animales, al tráfico, a las multitudes',
                        options: [
                            { value: 0, text: 'No presente' },
                            { value: 1, text: 'Leve' },
                            { value: 2, text: 'Moderado' },
                            { value: 3, text: 'Severo' },
                            { value: 4, text: 'Muy severo' }
                        ]
                    },
                    {
                        id: 4,
                        text: 'Insomnio: Dificultad de conciliación, sueño interrumpido, sueño insatisfactorio, fatiga al despertar',
                        options: [
                            { value: 0, text: 'No presente' },
                            { value: 1, text: 'Leve' },
                            { value: 2, text: 'Moderado' },
                            { value: 3, text: 'Severo' },
                            { value: 4, text: 'Muy severo' }
                        ]
                    },
                    {
                        id: 5,
                        text: 'Síntomas cardiovasculares: Taquicardia, palpitaciones, dolor precordial, latidos vasculares, sensación de desmayo',
                        options: [
                            { value: 0, text: 'No presente' },
                            { value: 1, text: 'Leve' },
                            { value: 2, text: 'Moderado' },
                            { value: 3, text: 'Severo' },
                            { value: 4, text: 'Muy severo' }
                        ]
                    }
                ],
                scoring: {
                    method: 'sum',
                    maxScore: 56,
                    interpretation: [
                        { range: [0, 17], level: 'Leve', description: 'Ansiedad leve', color: 'success' },
                        { range: [18, 24], level: 'Moderada', description: 'Ansiedad moderada', color: 'warning' },
                        { range: [25, 30], level: 'Severa', description: 'Ansiedad severa', color: 'danger' },
                        { range: [31, 56], level: 'Muy severa', description: 'Ansiedad muy severa', color: 'dark' }
                    ]
                }
            },

            // Tests Cognitivos Adicionales
            clock_drawing: {
                id: 'clock_drawing',
                name: 'Test del Reloj (Clock Drawing Test)',
                description: 'Evaluación rápida de función ejecutiva y visuoespacial',
                duration: '5 minutos',
                category: 'Cognitivo',
                icon: 'fas fa-clock',
                color: 'success',
                instructions: 'Dibuje un reloj con todos los números y las manecillas marcando las 11:10.',
                questions: [
                    {
                        id: 1,
                        text: 'Integridad del reloj: ¿Está presente un círculo cerrado?',
                        type: 'cognitive',
                        options: [
                            { value: 1, text: 'Círculo presente y cerrado' },
                            { value: 0, text: 'Círculo ausente o abierto significativamente' }
                        ]
                    },
                    {
                        id: 2,
                        text: 'Presencia de números: ¿Están presentes todos los números del 1 al 12?',
                        type: 'cognitive',
                        options: [
                            { value: 1, text: 'Todos los números presentes' },
                            { value: 0, text: 'Números faltantes o exceso de números' }
                        ]
                    },
                    {
                        id: 3,
                        text: 'Posición de números: ¿Están los números en las posiciones correctas?',
                        type: 'cognitive',
                        options: [
                            { value: 1, text: 'Números en posiciones apropiadas' },
                            { value: 0, text: 'Números mal posicionados' }
                        ]
                    },
                    {
                        id: 4,
                        text: 'Presencia de manecillas: ¿Están presentes ambas manecillas?',
                        type: 'cognitive',
                        options: [
                            { value: 1, text: 'Ambas manecillas presentes' },
                            { value: 0, text: 'Solo una o ninguna manecilla' }
                        ]
                    },
                    {
                        id: 5,
                        text: 'Tiempo correcto: ¿Las manecillas indican 11:10?',
                        type: 'cognitive',
                        options: [
                            { value: 1, text: 'Tiempo correcto (11:10)' },
                            { value: 0, text: 'Tiempo incorrecto' }
                        ]
                    }
                ],
                scoring: {
                    method: 'sum',
                    maxScore: 5,
                    interpretation: [
                        { range: [4, 5], level: 'Normal', description: 'Función visuoespacial y ejecutiva normal', color: 'success' },
                        { range: [2, 3], level: 'Deterioro leve', description: 'Posible deterioro cognitivo leve', color: 'warning' },
                        { range: [0, 1], level: 'Deterioro significativo', description: 'Deterioro cognitivo significativo', color: 'danger' }
                    ]
                }
            },

            trail_making: {
                id: 'trail_making',
                name: 'Trail Making Test (TMT)',
                description: 'Evaluación de atención dividida y flexibilidad cognitiva',
                duration: '10 minutos',
                category: 'Cognitivo',
                icon: 'fas fa-route',
                color: 'success',
                instructions: 'Conecte los números y letras en orden alternante (1-A-2-B-3-C...) lo más rápido posible.',
                questions: [
                    {
                        id: 1,
                        text: 'TMT-A: Tiempo para completar la conexión de números 1-25',
                        type: 'cognitive',
                        options: [
                            { value: 3, text: 'Menos de 30 segundos' },
                            { value: 2, text: '30-60 segundos' },
                            { value: 1, text: '60-120 segundos' },
                            { value: 0, text: 'Más de 120 segundos o no puede completar' }
                        ]
                    },
                    {
                        id: 2,
                        text: 'TMT-B: Tiempo para completar la conexión alternante número-letra',
                        type: 'cognitive',
                        options: [
                            { value: 3, text: 'Menos de 75 segundos' },
                            { value: 2, text: '75-150 segundos' },
                            { value: 1, text: '150-300 segundos' },
                            { value: 0, text: 'Más de 300 segundos o no puede completar' }
                        ]
                    },
                    {
                        id: 3,
                        text: 'Errores en TMT-A: Número de errores cometidos',
                        type: 'cognitive',
                        options: [
                            { value: 2, text: 'Sin errores' },
                            { value: 1, text: '1-2 errores' },
                            { value: 0, text: '3 o más errores' }
                        ]
                    },
                    {
                        id: 4,
                        text: 'Errores en TMT-B: Número de errores cometidos',
                        type: 'cognitive',
                        options: [
                            { value: 2, text: 'Sin errores' },
                            { value: 1, text: '1-3 errores' },
                            { value: 0, text: '4 o más errores' }
                        ]
                    }
                ],
                scoring: {
                    method: 'sum',
                    maxScore: 10,
                    interpretation: [
                        { range: [8, 10], level: 'Normal', description: 'Atención y función ejecutiva normales', color: 'success' },
                        { range: [5, 7], level: 'Deterioro leve', description: 'Posible deterioro en función ejecutiva', color: 'warning' },
                        { range: [0, 4], level: 'Deterioro significativo', description: 'Deterioro significativo en función ejecutiva', color: 'danger' }
                    ]
                }
            },

            // Tests de Personalidad
            big_five: {
                id: 'big_five',
                name: 'Big Five - Inventario de Personalidad',
                description: 'Evaluación de los cinco grandes factores de personalidad',
                duration: '15-20 minutos',
                category: 'Personalidad',
                icon: 'fas fa-user-friends',
                color: 'success',
                instructions: 'Indique qué tan de acuerdo está con cada afirmación sobre usted mismo.',
                questions: [
                    {
                        id: 1,
                        text: 'Me veo como alguien que es hablador',
                        factor: 'extraversion',
                        options: [
                            { value: 1, text: 'Muy en desacuerdo' },
                            { value: 2, text: 'Un poco en desacuerdo' },
                            { value: 3, text: 'Ni de acuerdo ni en desacuerdo' },
                            { value: 4, text: 'Un poco de acuerdo' },
                            { value: 5, text: 'Muy de acuerdo' }
                        ]
                    },
                    {
                        id: 2,
                        text: 'Me veo como alguien que tiende a encontrar defectos en otros',
                        factor: 'agreeableness',
                        reverse: true,
                        options: [
                            { value: 1, text: 'Muy en desacuerdo' },
                            { value: 2, text: 'Un poco en desacuerdo' },
                            { value: 3, text: 'Ni de acuerdo ni en desacuerdo' },
                            { value: 4, text: 'Un poco de acuerdo' },
                            { value: 5, text: 'Muy de acuerdo' }
                        ]
                    },
                    {
                        id: 3,
                        text: 'Me veo como alguien que hace bien las tareas',
                        factor: 'conscientiousness',
                        options: [
                            { value: 1, text: 'Muy en desacuerdo' },
                            { value: 2, text: 'Un poco en desacuerdo' },
                            { value: 3, text: 'Ni de acuerdo ni en desacuerdo' },
                            { value: 4, text: 'Un poco de acuerdo' },
                            { value: 5, text: 'Muy de acuerdo' }
                        ]
                    },
                    {
                        id: 4,
                        text: 'Me veo como alguien que se deprime, triste',
                        factor: 'neuroticism',
                        options: [
                            { value: 1, text: 'Muy en desacuerdo' },
                            { value: 2, text: 'Un poco en desacuerdo' },
                            { value: 3, text: 'Ni de acuerdo ni en desacuerdo' },
                            { value: 4, text: 'Un poco de acuerdo' },
                            { value: 5, text: 'Muy de acuerdo' }
                        ]
                    },
                    {
                        id: 5,
                        text: 'Me veo como alguien que es original, se le ocurren ideas nuevas',
                        factor: 'openness',
                        options: [
                            { value: 1, text: 'Muy en desacuerdo' },
                            { value: 2, text: 'Un poco en desacuerdo' },
                            { value: 3, text: 'Ni de acuerdo ni en desacuerdo' },
                            { value: 4, text: 'Un poco de acuerdo' },
                            { value: 5, text: 'Muy de acuerdo' }
                        ]
                    }
                ],
                scoring: {
                    method: 'factors',
                    factors: ['extraversion', 'agreeableness', 'conscientiousness', 'neuroticism', 'openness'],
                    interpretation: [
                        { factor: 'extraversion', description: 'Tendencia a ser sociable, asertivo y enérgico' },
                        { factor: 'agreeableness', description: 'Tendencia a ser cooperativo, confiado y empático' },
                        { factor: 'conscientiousness', description: 'Tendencia a ser organizado, responsable y persistente' },
                        { factor: 'neuroticism', description: 'Tendencia a experimentar emociones negativas' },
                        { factor: 'openness', description: 'Tendencia a ser creativo, curioso y abierto a nuevas experiencias' }
                    ]
                }
            },

            // Escalas de Psicosis
            panss: {
                id: 'panss',
                name: 'PANSS - Escala de Síndrome Positivo y Negativo',
                description: 'Evaluación comprensiva de síntomas psicóticos',
                duration: '30-40 minutos',
                category: 'Psicosis',
                icon: 'fas fa-brain',
                color: 'secondary',
                instructions: 'Escala de heteroaplicación para evaluar síntomas positivos, negativos y psicopatología general.',
                questions: [
                    {
                        id: 1,
                        text: 'P1 - Delirios: Creencias no fundamentadas, irreales o idiosincráticas',
                        subscale: 'positive',
                        options: [
                            { value: 1, text: 'Ausente' },
                            { value: 2, text: 'Mínimo' },
                            { value: 3, text: 'Leve' },
                            { value: 4, text: 'Moderado' },
                            { value: 5, text: 'Moderadamente severo' },
                            { value: 6, text: 'Severo' },
                            { value: 7, text: 'Extremo' }
                        ]
                    },
                    {
                        id: 2,
                        text: 'P2 - Desorganización conceptual: Proceso de pensamiento desorganizado, incoherente o ilógico',
                        subscale: 'positive',
                        options: [
                            { value: 1, text: 'Ausente' },
                            { value: 2, text: 'Mínimo' },
                            { value: 3, text: 'Leve' },
                            { value: 4, text: 'Moderado' },
                            { value: 5, text: 'Moderadamente severo' },
                            { value: 6, text: 'Severo' },
                            { value: 7, text: 'Extremo' }
                        ]
                    },
                    {
                        id: 3,
                        text: 'N1 - Embotamiento afectivo: Disminución de la respuesta emocional',
                        subscale: 'negative',
                        options: [
                            { value: 1, text: 'Ausente' },
                            { value: 2, text: 'Mínimo' },
                            { value: 3, text: 'Leve' },
                            { value: 4, text: 'Moderado' },
                            { value: 5, text: 'Moderadamente severo' },
                            { value: 6, text: 'Severo' },
                            { value: 7, text: 'Extremo' }
                        ]
                    },
                    {
                        id: 4,
                        text: 'N2 - Retraimiento emocional: Falta de interés o participación en eventos y actividades',
                        subscale: 'negative',
                        options: [
                            { value: 1, text: 'Ausente' },
                            { value: 2, text: 'Mínimo' },
                            { value: 3, text: 'Leve' },
                            { value: 4, text: 'Moderado' },
                            { value: 5, text: 'Moderadamente severo' },
                            { value: 6, text: 'Severo' },
                            { value: 7, text: 'Extremo' }
                        ]
                    },
                    {
                        id: 5,
                        text: 'G1 - Preocupación somática: Quejas físicas o creencias sobre disfunciones corporales',
                        subscale: 'general',
                        options: [
                            { value: 1, text: 'Ausente' },
                            { value: 2, text: 'Mínimo' },
                            { value: 3, text: 'Leve' },
                            { value: 4, text: 'Moderado' },
                            { value: 5, text: 'Moderadamente severo' },
                            { value: 6, text: 'Severo' },
                            { value: 7, text: 'Extremo' }
                        ]
                    }
                ],
                scoring: {
                    method: 'subscales',
                    subscales: ['positive', 'negative', 'general'],
                    interpretation: [
                        { subscale: 'positive', description: 'Síntomas positivos (delirios, alucinaciones, desorganización)' },
                        { subscale: 'negative', description: 'Síntomas negativos (embotamiento afectivo, alogia, abulia)' },
                        { subscale: 'general', description: 'Psicopatología general (ansiedad, depresión, síntomas cognitivos)' }
                    ]
                }
            },

            // Tests de Adicciones Adicionales
            dast10: {
                id: 'dast10',
                name: 'DAST-10 - Test de Screening de Abuso de Drogas',
                description: 'Screening para problemas relacionados con drogas',
                duration: '5 minutos',
                category: 'Adicciones',
                icon: 'fas fa-pills',
                color: 'danger',
                instructions: 'Las siguientes preguntas se refieren al uso de drogas. Responda honestamente.',
                questions: [
                    {
                        id: 1,
                        text: '¿Ha usado drogas distintas a las requeridas por razones médicas?',
                        options: [
                            { value: 0, text: 'No' },
                            { value: 1, text: 'Sí' }
                        ]
                    },
                    {
                        id: 2,
                        text: '¿Ha abusado de medicamentos recetados?',
                        options: [
                            { value: 0, text: 'No' },
                            { value: 1, text: 'Sí' }
                        ]
                    },
                    {
                        id: 3,
                        text: '¿Usa más de una droga a la vez?',
                        options: [
                            { value: 0, text: 'No' },
                            { value: 1, text: 'Sí' }
                        ]
                    },
                    {
                        id: 4,
                        text: '¿Puede parar de usar drogas cuando quiere?',
                        reverse: true,
                        options: [
                            { value: 1, text: 'No' },
                            { value: 0, text: 'Sí' }
                        ]
                    },
                    {
                        id: 5,
                        text: '¿Ha tenido "blackouts" o "flashbacks" como resultado del uso de drogas?',
                        options: [
                            { value: 0, text: 'No' },
                            { value: 1, text: 'Sí' }
                        ]
                    }
                ],
                scoring: {
                    method: 'sum',
                    interpretation: [
                        { range: [0, 0], level: 'Sin problemas', description: 'No hay evidencia de problemas relacionados con drogas', color: 'success' },
                        { range: [1, 2], level: 'Bajo nivel', description: 'Bajo nivel de problemas relacionados con drogas', color: 'warning' },
                        { range: [3, 5], level: 'Moderado', description: 'Nivel moderado de problemas relacionados con drogas', color: 'orange' },
                        { range: [6, 8], level: 'Sustancial', description: 'Nivel sustancial de problemas relacionados con drogas', color: 'danger' },
                        { range: [9, 10], level: 'Severo', description: 'Nivel severo de problemas relacionados con drogas', color: 'dark' }
                    ]
                }
            },

            cage: {
                id: 'cage',
                name: 'CAGE - Cuestionario de Alcoholismo',
                description: 'Screening rápido para problemas de alcohol',
                duration: '2 minutos',
                category: 'Adicciones',
                icon: 'fas fa-wine-bottle',
                color: 'danger',
                instructions: 'Responda sí o no a las siguientes preguntas sobre su consumo de alcohol.',
                questions: [
                    {
                        id: 1,
                        text: '¿Ha sentido alguna vez que debería reducir (Cut down) su consumo de alcohol?',
                        options: [
                            { value: 0, text: 'No' },
                            { value: 1, text: 'Sí' }
                        ]
                    },
                    {
                        id: 2,
                        text: '¿Le ha molestado (Annoyed) que la gente critique su forma de beber?',
                        options: [
                            { value: 0, text: 'No' },
                            { value: 1, text: 'Sí' }
                        ]
                    },
                    {
                        id: 3,
                        text: '¿Se ha sentido alguna vez mal o culpable (Guilty) por su forma de beber?',
                        options: [
                            { value: 0, text: 'No' },
                            { value: 1, text: 'Sí' }
                        ]
                    },
                    {
                        id: 4,
                        text: '¿Ha tomado alguna vez un trago a primera hora de la mañana (Eye opener) para calmar sus nervios o para quitar una resaca?',
                        options: [
                            { value: 0, text: 'No' },
                            { value: 1, text: 'Sí' }
                        ]
                    }
                ],
                scoring: {
                    method: 'sum',
                    interpretation: [
                        { range: [0, 1], level: 'Bajo riesgo', description: 'Bajo riesgo de alcoholismo', color: 'success' },
                        { range: [2, 2], level: 'Posible problema', description: 'Posible problema con el alcohol, evaluación adicional recomendada', color: 'warning' },
                        { range: [3, 4], level: 'Problema probable', description: 'Problema probable con el alcohol, evaluación profesional necesaria', color: 'danger' }
                    ]
                }
            },

            michigan_alcoholism: {
                id: 'michigan_alcoholism',
                name: 'MAST - Test de Alcoholismo de Michigan',
                description: 'Evaluación comprensiva de problemas relacionados con alcohol',
                duration: '10 minutos',
                category: 'Adicciones',
                icon: 'fas fa-glass-whiskey',
                color: 'danger',
                instructions: 'Responda sí o no a las siguientes preguntas sobre su historia con el alcohol.',
                questions: [
                    {
                        id: 1,
                        text: '¿Considera usted que es un bebedor normal?',
                        points: 2,
                        reverse: true,
                        options: [
                            { value: 2, text: 'No' },
                            { value: 0, text: 'Sí' }
                        ]
                    },
                    {
                        id: 2,
                        text: '¿Alguna vez se ha despertado por la mañana después de haber bebido la noche anterior y ha descubierto que no podía recordar parte de esa noche?',
                        points: 2,
                        options: [
                            { value: 0, text: 'No' },
                            { value: 2, text: 'Sí' }
                        ]
                    },
                    {
                        id: 3,
                        text: '¿Su esposa, marido, un padre u otro pariente cercano se ha preocupado o quejado alguna vez sobre su forma de beber?',
                        points: 1,
                        options: [
                            { value: 0, text: 'No' },
                            { value: 1, text: 'Sí' }
                        ]
                    },
                    {
                        id: 4,
                        text: '¿Puede usted parar de beber sin dificultad después de uno o dos tragos?',
                        points: 2,
                        reverse: true,
                        options: [
                            { value: 2, text: 'No' },
                            { value: 0, text: 'Sí' }
                        ]
                    },
                    {
                        id: 5,
                        text: '¿Se ha sentido alguna vez culpable sobre su forma de beber?',
                        points: 1,
                        options: [
                            { value: 0, text: 'No' },
                            { value: 1, text: 'Sí' }
                        ]
                    }
                ],
                scoring: {
                    method: 'weighted_sum',
                    interpretation: [
                        { range: [0, 3], level: 'Sin problemas', description: 'No hay evidencia de alcoholismo', color: 'success' },
                        { range: [4, 5], level: 'Posible problema', description: 'Posible problema con el alcohol', color: 'warning' },
                        { range: [6, 13], level: 'Problema probable', description: 'Problema probable con el alcohol', color: 'danger' },
                        { range: [14, 53], level: 'Alcoholismo', description: 'Fuerte evidencia de alcoholismo', color: 'dark' }
                    ]
                }
            }
        };
    }

    // Método auxiliar para obtener datos de un test específico
    getTestData(testId) {
        const tests = this.getTestDatabase();
        return tests[testId] || null;
    }

    // No longer needed - using category-based test selection
    loadTestLibrary() {
        // Tests are now accessed through category buttons
        console.info('Tests disponibles a través de categorías');
    }

    startTest(testId) {
        const tests = this.getTestDatabase();
        this.currentTest = tests[testId];
        if (!this.currentTest) return;

        console.log('Iniciando test:', this.currentTest.name);

        this.currentQuestionIndex = 0;
        this.responses = {};
        
        // Ocultar contenido principal y mostrar interfaz del test
        const mainContent = document.getElementById('mainContent');
        if (mainContent) mainContent.style.display = 'none';
        
        document.getElementById('testInterface').style.display = 'block';
        
        this.displayTestHeader();
        this.displayCurrentQuestion();
    }

    displayTestHeader() {
        const headerContainer = document.getElementById('testHeader');
        const progressPercent = ((this.currentQuestionIndex + 1) / this.currentTest.questions.length) * 100;
        
        headerContainer.innerHTML = `
            <div class="test-header text-white p-4 mb-5 rounded-3 shadow-lg" style="background: var(--psiqui-gradient-primary);">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h2 class="mb-3 fw-bold">
                            <i class="${this.currentTest.icon} me-3"></i>
                            ${this.currentTest.name}
                        </h2>
                        <p class="mb-2 fs-5">${this.currentTest.description}</p>
                        <div class="alert border-0 mb-0" style="background-color: rgba(255,255,255,0.15); color: white;">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>Instrucciones:</strong> ${this.currentTest.instructions}
                        </div>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <div class="test-progress p-3 rounded" style="background-color: rgba(255,255,255,0.15);">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <small class="fw-bold text-white">Progreso del Test</small>
                                <small class="fw-bold text-white">${Math.round(progressPercent)}%</small>
                            </div>
                            <div class="progress mb-2" style="height: 10px; background-color: rgba(255,255,255,0.2);">
                                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                     style="width: ${progressPercent}%; background-color: white;"></div>
                            </div>
                            <div class="text-center">
                                <span class="badge px-3 py-2" style="background-color: white; color: var(--psiqui-primary);">
                                    Pregunta ${this.currentQuestionIndex + 1} de ${this.currentTest.questions.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    displayCurrentQuestion() {
        const question = this.currentTest.questions[this.currentQuestionIndex];
        const questionContainer = document.getElementById('questionContainer');
        
        console.log(`DEBUG displayCurrentQuestion: Mostrando pregunta ${this.currentQuestionIndex + 1} de ${this.currentTest.questions.length}`);
        console.log(`  ID de pregunta: ${question.id}`);
        console.log(`  Texto: ${question.text}`);
        
        questionContainer.innerHTML = `
            <div class="question-card animate__animated animate__fadeIn pt-4">
                <div class="card border-0 shadow-lg">
                    <div class="card-header border-0 p-4" style="background: var(--psiqui-light);">
                        <h3 class="question-title mb-0" style="color: var(--psiqui-primary);">
                            <span class="badge me-3 fs-6" style="background: var(--psiqui-primary); color: white;">${question.id}</span>
                            ${question.text}
                        </h3>
                    </div>
                    <div class="card-body p-5">
                        <div class="row">
                            ${question.options.map((option, index) => `
                                <div class="col-12 mb-4">
                                    <div class="form-check option-item">
                                        <input class="form-check-input" type="radio" name="question_${question.id}" 
                                               id="option_${question.id}_${index}" value="${option.value}" 
                                               style="border-color: var(--psiqui-primary);">
                                        <label class="form-check-label w-100" for="option_${question.id}_${index}">
                                            <div class="option-content p-4 border rounded-3 h-100 transition-all" style="border-color: #e9ecef !important;">
                                                <div class="d-flex align-items-center">
                                                    <div class="flex-grow-1">
                                                        <strong style="color: var(--psiqui-dark);">${option.text}</strong>
                                                    </div>
                                                    <div class="ms-3">
                                                        <span class="badge" style="background: var(--psiqui-light); color: var(--psiqui-primary);">${option.value} pts</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <!-- Pequeño texto de advertencia -->
                        <div class="text-center mt-3">
                            <small class="response-required-warning text-danger" style="font-size: 0.85rem; font-weight: 500;">
                                <i class="fas fa-exclamation-circle me-1"></i>
                                Debes seleccionar una respuesta
                            </small>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .option-content {
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid #e9ecef !important;
                }
                .option-content:hover {
                    border-color: var(--bs-${this.currentTest.color}) !important;
                    background-color: var(--bs-${this.currentTest.color}-subtle);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .form-check-input:checked + .form-check-label .option-content {
                    border-color: var(--bs-${this.currentTest.color}) !important;
                    background-color: var(--bs-${this.currentTest.color}-subtle);
                    box-shadow: 0 0 0 3px rgba(var(--bs-${this.currentTest.color}-rgb), 0.25);
                }
                .transition-all {
                    transition: all 0.3s ease;
                }
            </style>
        `;

        // Restaurar respuesta si existe
        if (this.responses[question.id] !== undefined) {
            const radio = questionContainer.querySelector(`input[value="${this.responses[question.id]}"]`);
            if (radio) radio.checked = true;
        }

        this.updateNavigationButtons();
        // Verificar si ya hay una respuesta guardada para esta pregunta y marcarla
        if (savedResponse !== undefined) {
            const radio = questionContainer.querySelector(`input[value="${this.responses[question.id]}"]`);
            if (radio) radio.checked = true;
            
            // Ocultar el texto de advertencia si ya hay respuesta
            const warningText = questionContainer.querySelector('.response-required-warning');
            if (warningText) {
                warningText.style.opacity = '0';
                warningText.style.transform = 'translateY(-10px)';
            }
        }

        // Actualizar navegación después de mostrar la pregunta
        this.updateNavigationButtons();
    }

    updateNavigationButtons() {
        const navContainer = document.getElementById('testNavigation');
        const isFirstQuestion = this.currentQuestionIndex === 0;
        const isLastQuestion = this.currentQuestionIndex === this.currentTest.questions.length - 1;
        const hasResponse = this.responses[this.currentTest.questions[this.currentQuestionIndex].id] !== undefined;

        // DEBUG: Información detallada sobre la navegación
        console.log(`DEBUG updateNavigationButtons:`);
        console.log(`  Pregunta actual: ${this.currentQuestionIndex + 1} de ${this.currentTest.questions.length}`);
        console.log(`  isLastQuestion: ${isLastQuestion}`);
        console.log(`  Total preguntas:`, this.currentTest.questions.length);
        console.log(`  currentQuestionIndex:`, this.currentQuestionIndex);
        console.log(`  hasResponse:`, hasResponse);

        navContainer.innerHTML = `
            <div class="card border-0 shadow-sm mt-5">
                <div class="card-body p-5">
                    <div class="d-flex justify-content-between align-items-center">
                        <button class="btn btn-outline-secondary btn-lg prev-question-btn" 
                                ${isFirstQuestion ? 'disabled' : ''} 
                                style="border-color: var(--psiqui-primary); color: var(--psiqui-primary);">
                            <i class="fas fa-arrow-left me-2"></i>
                            Pregunta Anterior
                        </button>
                        
                        <div class="text-center">
                            <div class="mb-3">
                                <small class="fw-bold" style="color: var(--psiqui-dark);">Progreso del cuestionario</small>
                            </div>
                            <div class="progress" style="width: 220px; height: 8px; background-color: var(--psiqui-light);">
                                <div class="progress-bar" 
                                     style="width: ${((this.currentQuestionIndex + 1) / this.currentTest.questions.length) * 100}%; background: var(--psiqui-gradient-primary);"></div>
                            </div>
                        </div>
                        
                        <div class="d-flex gap-3">
                            ${!hasResponse ? 
                                `<div class="alert mb-0 py-2 px-3 animate__animated animate__fadeIn" 
                                      style="background: linear-gradient(135deg, #fff3cd, #ffeaa7); border: 1px solid #ffc107; color: #856404; border-radius: 8px;">
                                    <i class="fas fa-hand-pointer me-2"></i>
                                    <small><strong>Seleccione una opción</strong> para continuar</small>
                                </div>` : ''
                            }
                            ${isLastQuestion ? 
                                `<button class="btn btn-lg finish-test-btn ${!hasResponse ? 'disabled' : ''}" 
                                         style="
                                             background: ${hasResponse ? 'var(--psiqui-success)' : '#6c757d'}; 
                                             border-color: ${hasResponse ? 'var(--psiqui-success)' : '#6c757d'}; 
                                             color: white;
                                             opacity: ${hasResponse ? '1' : '0.6'};
                                             cursor: ${hasResponse ? 'pointer' : 'not-allowed'};
                                             transition: all 0.3s ease;
                                         ">
                                    <i class="fas fa-flag-checkered me-2"></i>
                                    Finalizar Cuestionario
                                </button>` :
                                `<button class="btn btn-lg next-question-btn ${!hasResponse ? 'disabled' : ''}" 
                                         style="
                                             background: ${hasResponse ? 'var(--psiqui-primary)' : '#6c757d'}; 
                                             border-color: ${hasResponse ? 'var(--psiqui-primary)' : '#6c757d'}; 
                                             color: white;
                                             opacity: ${hasResponse ? '1' : '0.6'};
                                             cursor: ${hasResponse ? 'pointer' : 'not-allowed'};
                                             transition: all 0.3s ease;
                                         ">
                                    Siguiente Pregunta
                                    <i class="fas fa-arrow-right ms-2"></i>
                                </button>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    nextQuestion() {
        // Verificar que la pregunta actual tenga respuesta antes de avanzar
        const currentQuestion = this.currentTest.questions[this.currentQuestionIndex];
        const currentQuestionId = currentQuestion.id;
        
        if (this.responses[currentQuestionId] === undefined) {
            // Solo hacer que el texto rojo parpadee para llamar la atención
            const warningText = document.querySelector('.response-required-warning');
            if (warningText) {
                warningText.style.animation = 'pulse 0.5s ease 3';
            }
            console.log(`Usuario intentó avanzar sin responder la pregunta ${currentQuestionId}`);
            return;
        }
        
        // Si tiene respuesta, avanzar normalmente
        this.moveToNextQuestion();
    }

    moveToNextQuestion() {
        if (this.currentQuestionIndex < this.currentTest.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayTestHeader();
            this.displayCurrentQuestion();
        }
    }

    showMissingResponseIndicator() {
        // Encontrar el contenedor de opciones y añadir indicación visual
        const questionContainer = document.getElementById('questionContainer');
        const optionsContainer = questionContainer.querySelector('.row');
        
        // Remover indicadores previos
        const existingIndicator = questionContainer.querySelector('.missing-response-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Crear nuevo indicador
        const indicator = document.createElement('div');
        indicator.className = 'missing-response-indicator alert alert-danger d-flex align-items-center mt-3 animate__animated animate__shakeX';
        indicator.style.cssText = `
            background: linear-gradient(135deg, #dc3545, #c82333);
            border: none;
            color: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
        `;
        indicator.innerHTML = `
            <i class="fas fa-exclamation-triangle me-3" style="font-size: 1.2rem;"></i>
            <div>
                <strong>Respuesta requerida</strong><br>
                <small>Por favor seleccione una opción para continuar</small>
            </div>
        `;
        
        // Añadir el indicador después de las opciones
        optionsContainer.parentNode.appendChild(indicator);
        
        // Resaltar todas las opciones con borde rojo
        const optionItems = questionContainer.querySelectorAll('.option-content');
        optionItems.forEach(option => {
            option.style.borderColor = '#dc3545';
            option.style.borderWidth = '2px';
            option.style.animation = 'pulse 0.5s ease';
        });
        
        // Remover el indicador después de 4 segundos
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.style.animation = 'fadeOut 0.5s ease';
                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.remove();
                    }
                }, 500);
            }
            
            // Restaurar bordes normales
            optionItems.forEach(option => {
                option.style.borderColor = '#e9ecef';
                option.style.borderWidth = '1px';
                option.style.animation = '';
            });
        }, 4000);
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayTestHeader();
            this.displayCurrentQuestion();
        }
    }

    finishTest() {
        console.log('finishTest llamado');
        console.log('Respuestas actuales:', this.responses);
        console.log('Test actual:', this.currentTest);
        
        if (!this.currentTest) {
            console.error('No hay test activo');
            return;
        }
        
        // Verificar que todas las preguntas estén respondidas
        const totalQuestions = this.currentTest.questions.length;
        const answeredQuestions = Object.keys(this.responses).length;
        
        console.log(`DEBUG finishTest: ${answeredQuestions} de ${totalQuestions} preguntas respondidas`);
        
        if (answeredQuestions < totalQuestions) {
            const missingQuestions = [];
            for (let i = 0; i < totalQuestions; i++) {
                const questionId = this.currentTest.questions[i].id;
                if (this.responses[questionId] === undefined) {
                    missingQuestions.push(questionId);
                }
            }
            console.log('Preguntas faltantes:', missingQuestions);
            
            // En lugar de alert, mostrar indicación visual
            this.showMissingResponseIndicator();
            return;
        }
        
        const score = this.calculateScore();
        console.log('Puntuación calculada:', score);
        
        // DEBUG: Simulación con puntuación máxima para verificar rangos
        const numQuestions = this.currentTest.questions.length;
        const maxScore = numQuestions * 3; // Asumiendo máximo 3 por pregunta
        console.log(`DEBUG: Máximo teórico posible: ${maxScore} (${numQuestions} preguntas × 3 puntos)`);
        console.log('DEBUG: Rangos de interpretación:', this.currentTest.scoring.interpretation);
        
        const interpretation = this.interpretScore(score);
        console.log('Interpretación:', interpretation);
        
        // DEBUG: Probar qué interpretación daría la puntuación máxima
        const maxInterpretation = this.interpretScore(maxScore);
        console.log(`DEBUG: Con puntuación máxima (${maxScore}) sería:`, maxInterpretation);
        
        const resultId = Date.now();
        const result = {
            id: resultId,
            testId: this.currentTest.id,
            testName: this.currentTest.name,
            date: new Date().toISOString(),
            score: score,
            interpretation: interpretation,
            responses: { ...this.responses }
        };

        // Guardar resultado - verificar duplicados por ID
        const existingIndex = this.testResults.findIndex(r => r.id === resultId);
        if (existingIndex === -1) {
            this.testResults.push(result);
            console.log('✅ Resultado guardado correctamente:', result);
        } else {
            console.warn('⚠️ Resultado duplicado detectado, no se agrega');
        }
        localStorage.setItem('psychometric_results', JSON.stringify(this.testResults));

        this.displayResults(result);
    }

    // Función para validar que los rangos de puntuación sean correctos matemáticamente
    validateTestScoring(test) {
        if (!test || !test.questions || !test.questions.length || !test.scoring || !test.scoring.interpretation) {
            console.warn(`⚠️ Test ${test?.name || 'unknown'}: Configuración incompleta`);
            return false;
        }

        try {
            const numQuestions = test.questions.length;
            const maxValuePerQuestion = Math.max(...test.questions[0].options.map(opt => opt.value));
            const theoreticalMax = numQuestions * maxValuePerQuestion;
            
            // Encontrar el máximo rango definido en la interpretación (con validación)
            const validRanges = test.scoring.interpretation
                .filter(interp => interp.range && Array.isArray(interp.range) && interp.range.length >= 2)
                .map(interp => interp.range[1]);
            
            if (validRanges.length === 0) {
                console.warn(`⚠️ Test ${test.name}: No hay rangos válidos definidos`);
                return false;
            }
            
            const maxRange = Math.max(...validRanges);
            
            if (maxRange > theoreticalMax) {
                console.warn(`⚠️ Test ${test.name}: Rango máximo (${maxRange}) excede el máximo teórico (${theoreticalMax})`);
                console.warn(`   Preguntas: ${numQuestions}, Máximo por pregunta: ${maxValuePerQuestion}`);
                return false;
            }
            
            console.log(`✅ Test ${test.name}: Rango válido (${maxRange}/${theoreticalMax})`);
            return true;
        } catch (error) {
            console.error(`❌ Error validando test ${test.name}:`, error);
            return false;
        }
    }

    calculateScore() {
        if (!this.currentTest || !this.currentTest.scoring) {
            console.error('No hay configuración de puntuación disponible');
            return 0;
        }
        
        if (this.currentTest.scoring.method === 'sum') {
            const responseValues = Object.values(this.responses);
            console.log('Valores de respuestas para suma:', responseValues);
            return responseValues.reduce((sum, value) => sum + (parseInt(value) || 0), 0);
        }
        
        return 0;
    }

    interpretScore(testIdOrScore, scoreOrUndefined) {
        // Manejar ambas firmas: interpretScore(score) o interpretScore(testId, score)
        let score, testToUse;
        
        if (scoreOrUndefined !== undefined) {
            // Se llamó con (testId, score)
            const testId = testIdOrScore;
            score = scoreOrUndefined;
            
            // Buscar el test en la base de datos
            const testDatabase = this.getTestDatabase();
            testToUse = testDatabase[testId] || this.currentTest;
            console.log(`DEBUG interpretScore: Usando test específico: ${testId}`);
        } else {
            // Se llamó con (score) - usar currentTest
            score = testIdOrScore;
            testToUse = this.currentTest;
            console.log(`DEBUG interpretScore: Usando currentTest`);
        }
        
        if (!testToUse || !testToUse.scoring || !testToUse.scoring.interpretation) {
            console.error('No hay interpretación disponible para este test');
            return {
                range: [0, 100],
                level: 'Resultado',
                description: 'Puntuación obtenida: ' + score,
                color: 'primary',
                percentile: 50
            };
        }
        
        const interpretations = testToUse.scoring.interpretation;
        console.log(`DEBUG interpretScore: Buscando interpretación para puntuación ${score}`);
        console.log(`DEBUG interpretScore: Test: ${testToUse.name}`);
        
        for (const interpretation of interpretations) {
            if (interpretation.range && interpretation.range.length >= 2) {
                console.log(`  Verificando rango [${interpretation.range[0]}, ${interpretation.range[1]}] - ${interpretation.level}`);
                if (score >= interpretation.range[0] && score <= interpretation.range[1]) {
                    console.log(`  ✅ COINCIDE con rango [${interpretation.range[0]}, ${interpretation.range[1]}] - ${interpretation.level}`);
                    return interpretation;
                }
            }
        }
        
        console.log('  ❌ No se encontró rango específico, usando el último');
        
        // Si no encuentra interpretación, devolver la última
        if (interpretations.length > 0) {
            return interpretations[interpretations.length - 1];
        }
        
        // Fallback si no hay interpretaciones
        return {
            range: [0, 100],
            level: 'Resultado',
            description: 'Puntuación obtenida: ' + score,
            color: 'primary',
            percentile: 50
        };
    }

    displayResults(result) {
        document.getElementById('testInterface').style.display = 'none';
        document.getElementById('testResults').style.display = 'block';

        const resultsContainer = document.getElementById('resultsContainer');
        const maxScore = this.currentTest.scoring.maxScore || Math.max(...this.currentTest.scoring.interpretation.map(i => i.range[1]));
        
        resultsContainer.innerHTML = `
            <div class="results-header text-center mb-5">
                <div class="card border-0 shadow-lg">
                    <div class="card-header bg-${result.interpretation.color} text-white py-4">
                        <h2 class="mb-0">
                            <i class="${this.currentTest.icon} me-3"></i>
                            Resultados del Test
                        </h2>
                    </div>
                    <div class="card-body p-5">
                        <h3 class="text-${result.interpretation.color} mb-3">${this.currentTest.name}</h3>
                        <div class="score-display mb-4">
                            <div class="score-circle mx-auto mb-3 bg-${result.interpretation.color} text-white d-flex align-items-center justify-content-center" 
                                 style="width: 120px; height: 120px; border-radius: 50%; font-size: 2rem; font-weight: bold;">
                                ${result.score}${maxScore ? `/${maxScore}` : ''}
                            </div>
                            <h4 class="text-${result.interpretation.color}">${result.interpretation.level}</h4>
                            <p class="lead">${result.interpretation.description}</p>
                        </div>
                        
                        <div class="interpretation-details">
                            <div class="alert alert-${result.interpretation.color} alert-dismissible" role="alert">
                                <strong>Interpretación clínica:</strong><br>
                                ${this.getDetailedInterpretation(result)}
                            </div>
                        </div>
                        
                        <div class="result-actions mt-4">
                            <button class="btn btn-primary me-2" onclick="window.print()">
                                <i class="fas fa-print me-2"></i>
                                Imprimir Resultados
                            </button>
                            <button class="btn btn-success me-2" onclick="psychometricManager.saveResultsToPDF()">
                                <i class="fas fa-file-pdf me-2"></i>
                                Guardar PDF
                            </button>
                            <button class="btn btn-outline-secondary" onclick="psychometricManager.returnToLibrary()">
                                <i class="fas fa-arrow-left me-2"></i>
                                Volver a Tests
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="detailed-analysis">
                <h4 class="mb-3">Análisis Detallado por Pregunta</h4>
                <div class="card">
                    <div class="card-body">
                        ${this.generateDetailedAnalysis(result)}
                    </div>
                </div>
            </div>
        `;
    }

    getClinicalRecommendation(result) {
        const interpretations = {
            phq9: {
                'Mínima': 'Síntomas mínimos de depresión. No se requiere intervención específica. Monitoreo de rutina recomendado.',
                'Leve': 'Depresión leve. Considerar psicoterapia de apoyo, activación conductual, o vigilancia activa. Reevaluar en 2-4 semanas.',
                'Moderada': 'Depresión moderada. Indicado tratamiento antidepresivo (ISRS/IRSN) y/o psicoterapia estructurada (TCC, TIP). Seguimiento quincenal.',
                'Moderadamente severa': 'Depresión moderadamente severa. Tratamiento combinado (farmacológico + psicoterapia). Evaluación de riesgo suicida. Seguimiento semanal.',
                'Severa': 'Depresión severa. Requiere tratamiento intensivo, evaluación de hospitalización si hay riesgo suicida. Considerar antidepresivos de alta potencia o terapias aumentativas.'
            },
            gad7: {
                'Mínima': 'Ansiedad mínima. Sin necesidad de intervención específica. Técnicas de manejo del estrés pueden ser beneficiosas.',
                'Leve': 'Ansiedad leve. Técnicas de relajación, mindfulness, ejercicio regular. Considerar psicoeducación sobre ansiedad.',
                'Moderada': 'Ansiedad moderada. Indicada TCC especializada para ansiedad, considerar ISRS/IRSN. Técnicas de exposición gradual.',
                'Severa': 'Ansiedad severa. Tratamiento combinado urgente. ISRS/IRSN más TCC. Evaluación de comorbilidades. Benzodiacepinas solo a corto plazo.'
            },
            beck_depression: {
                'Mínima': 'Estado de ánimo dentro de rangos normales. Mantener estrategias de bienestar y prevención.',
                'Leve': 'Síntomas depresivos leves. Activación conductual, rutina de ejercicio, higiene del sueño. Psicoterapia de apoyo.',
                'Moderada': 'Depresión clínicamente significativa. Iniciar antidepresivo (primer episodio) o ajustar dosis (episodios recurrentes). TCC recomendada.',
                'Severa': 'Depresión severa con alto impacto funcional. Tratamiento farmacológico intensivo, considerar combinaciones. TCC intensiva. Evaluar hospitalización si riesgo suicida.'
            },
            beck_anxiety: {
                'Mínima': 'Niveles normales de síntomas físicos de ansiedad. Continuar con estrategias de autocuidado.',
                'Leve': 'Síntomas físicos leves de ansiedad. Técnicas de respiración, relajación muscular progresiva, ejercicio aeróbico regular.',
                'Moderada': 'Síntomas ansiosos moderados. TCC enfocada en síntomas somáticos, considerar ISRS. Descartar causas médicas.',
                'Severa': 'Síntomas severos que requieren evaluación médica urgente. Tratamiento farmacológico inmediato, TCC intensiva, descartar trastorno de pánico.'
            },
            mini_mental: {
                'Normal': 'Función cognitiva preservada para la edad y nivel educativo. Mantener actividades cognitivamente estimulantes.',
                'Deterioro leve': 'Posible deterioro cognitivo leve. Evaluación neuropsicológica completa recomendada. Descartar causas reversibles (depresión, medicamentos).',
                'Deterioro severo': 'Deterioro cognitivo significativo. Evaluación neurológica urgente. Considerar neuroimagen, biomarcadores. Evaluación de capacidad funcional.'
            },
            moca: {
                'Normal': 'Función cognitiva normal. Excelente rendimiento en screening cognitivo.',
                'Deterioro leve': 'Posible deterioro cognitivo leve (DCL). Evaluación neuropsicológica formal, seguimiento cada 6-12 meses.',
                'Deterioro moderado': 'Deterioro cognitivo moderado. Evaluación para demencia temprana. Neuroimagen y biomarcadores indicados.',
                'Deterioro severo': 'Deterioro cognitivo severo. Alta probabilidad de demencia. Evaluación neurológica completa urgente.'
            },
            audit: {
                'Bajo riesgo': 'Patrón de consumo de alcohol de bajo riesgo. Mantener hábitos actuales, educación sobre límites seguros.',
                'Sin problemas': 'Sin evidencia de problemas relacionados con el alcohol. Continuar con patrones actuales de consumo.',
                'Riesgo': 'Consumo de riesgo. Intervención breve, consejería sobre reducción del consumo. Seguimiento en 3-6 meses.',
                'Posible problema': 'Posible problema con el alcohol. Evaluación más detallada recomendada. Considerar intervención breve.',
                'Uso perjudicial': 'Uso perjudicial del alcohol. Intervención especializada necesaria. Evaluación médica completa, posible tratamiento farmacológico.',
                'Problema probable': 'Problema probable con el alcohol. Derivación a especialista recomendada. Evaluación de dependencia.',
                'Dependencia': 'Probable trastorno por uso de alcohol severo. Derivación urgente a especialista en adicciones. Considerar desintoxicación médica supervisada.',
                'Alcoholismo': 'Fuerte evidencia de alcoholismo. Tratamiento inmediato requerido. Desintoxicación médica supervisada obligatoria.'
            }
        };

        // Manejar diferentes formatos de entrada
        let testId, interpretationLevel;
        
        if (result.testId) {
            testId = result.testId;
            interpretationLevel = result.interpretation?.level;
        } else if (result.interpretation) {
            // Para calculadora manual
            testId = this.calculatorCurrentTest?.id;
            interpretationLevel = result.interpretation.level;
        } else {
            return 'Consulte con un profesional de salud mental para interpretación detallada y plan de tratamiento individualizado.';
        }

        return interpretations[testId]?.[interpretationLevel] || 
               'Consulte con un profesional de salud mental para interpretación detallada y plan de tratamiento individualizado.';
    }

    getDetailedInterpretation(result) {
        // Este método ahora usa getClinicalRecommendation para evitar duplicación
        return this.getClinicalRecommendation(result);
    }

    generateDetailedAnalysis(result) {
        return this.currentTest.questions.map((question, index) => {
            const response = this.responses[question.id];
            const selectedOption = question.options.find(opt => opt.value === response);
            
            return `
                <div class="question-analysis mb-3 p-3 border-start border-3 border-${this.currentTest.color}">
                    <h6 class="text-${this.currentTest.color}">Pregunta ${question.id}: ${question.text}</h6>
                    <p class="mb-1"><strong>Respuesta:</strong> ${selectedOption?.text || 'No respondida'}</p>
                    <small class="text-muted">Puntuación: ${response || 0} puntos</small>
                </div>
            `;
        }).join('');
    }

    returnToLibrary() {
        // Ocultar interfaces de test y mostrar contenido principal
        document.getElementById('testResults').style.display = 'none';
        document.getElementById('testInterface').style.display = 'none';
        
        const mainContent = document.getElementById('mainContent');
        if (mainContent) mainContent.style.display = 'block';
        
        this.currentTest = null;
        this.currentQuestionIndex = 0;
        this.responses = {};
    }

    saveResultsToPDF() {
        // Placeholder para funcionalidad de PDF
        alert('Funcionalidad de PDF en desarrollo. Use la opción de imprimir por ahora.');
    }

    // === HERRAMIENTAS DE ANÁLISIS ===
    
    openCalculator() {
        // Verificar si hay tests completados
        if (this.testResults.length === 0) {
            this.showAlert('No hay resultados de tests para calcular. Complete al menos un test primero.', 'warning');
            return;
        }

        const modal = this.createCalculatorModal();
        document.body.appendChild(modal);
        
        // Mostrar modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Limpiar modal al cerrarse
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    createCalculatorModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header" style="background: var(--psiqui-primary); color: white;">
                        <h5 class="modal-title">
                            <i class="fas fa-calculator me-2"></i>
                            Calculadora de Puntajes
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-primary mb-3">Seleccionar Test</h6>
                                <select class="form-select mb-3" id="calculatorTestSelect">
                                    <option value="">Seleccione un test...</option>
                                    ${this.getAvailableTestsForCalculator()}
                                </select>
                                
                                <div id="calculatorForm" style="display: none;">
                                    <h6 class="text-secondary mb-3">Ingresar Respuestas</h6>
                                    <div id="calculatorQuestions"></div>
                                    <button class="btn btn-primary mt-3" onclick="psychometricManager.calculateManualScore()">
                                        <i class="fas fa-calculator me-2"></i>
                                        Calcular Puntaje
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-success mb-3">Resultados Previos</h6>
                                <div id="previousResults">
                                    ${this.getPreviousResultsHTML()}
                                </div>
                            </div>
                        </div>
                        
                        <div id="calculationResult" class="mt-4" style="display: none;"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Event listener para cambio de test
        modal.querySelector('#calculatorTestSelect').addEventListener('change', (e) => {
            this.loadCalculatorForm(e.target.value);
        });
        
        return modal;
    }

    getAvailableTestsForCalculator() {
        const tests = {
            'phq9': 'PHQ-9 - Cuestionario de Depresión',
            'gad7': 'GAD-7 - Trastorno de Ansiedad Generalizada',
            'beck_depression': 'Inventario de Depresión de Beck',
            'beck_anxiety': 'Inventario de Ansiedad de Beck',
            'mini_mental': 'Mini Mental State Examination',
            'moca': 'Test Cognitivo de Montreal',
            'audit': 'Test de Identificación de Trastornos por Uso de Alcohol'
        };
        
        return Object.entries(tests).map(([id, name]) => 
            `<option value="${id}">${name}</option>`
        ).join('');
    }

    getPreviousResultsHTML() {
        if (this.testResults.length === 0) {
            return '<p class="text-muted">No hay resultados previos</p>';
        }
        
        return this.testResults.slice(-5).map(result => `
            <div class="card mb-2">
                <div class="card-body p-2">
                    <small class="text-muted">${result.date}</small>
                    <h6 class="mb-1">${result.testName}</h6>
                    <span class="badge bg-primary">${result.score} puntos</span>
                    <span class="badge bg-secondary">${result.interpretation.level}</span>
                </div>
            </div>
        `).join('');
    }

    loadCalculatorForm(testId) {
        const form = document.getElementById('calculatorForm');
        const questionsContainer = document.getElementById('calculatorQuestions');
        
        if (!testId) {
            form.style.display = 'none';
            return;
        }
        
        const testData = this.getTestData(testId);
        if (!testData) return;
        
        questionsContainer.innerHTML = testData.questions.map((question, index) => `
            <div class="mb-3">
                <label class="form-label fw-bold">${index + 1}. ${question.text}</label>
                <select class="form-select" name="calc_question_${question.id}">
                    <option value="">Seleccione...</option>
                    ${question.options.map(opt => 
                        `<option value="${opt.value}">${opt.text}</option>`
                    ).join('')}
                </select>
            </div>
        `).join('');
        
        // Almacenar test actual para cálculo
        this.calculatorCurrentTest = testData;
        form.style.display = 'block';
    }

    calculateManualScore() {
        if (!this.calculatorCurrentTest) return;
        
        const formData = new FormData();
        const selects = document.querySelectorAll('#calculatorQuestions select');
        let totalScore = 0;
        let answeredQuestions = 0;
        
        selects.forEach(select => {
            if (select.value) {
                totalScore += parseInt(select.value);
                answeredQuestions++;
            }
        });
        
        if (answeredQuestions < this.calculatorCurrentTest.questions.length) {
            this.showAlert('Por favor complete todas las preguntas antes de calcular.', 'warning');
            return;
        }
        
        const interpretation = this.interpretScore(this.calculatorCurrentTest.id, totalScore);
        this.displayCalculationResult(totalScore, interpretation);
    }

    displayCalculationResult(score, interpretation) {
        const resultContainer = document.getElementById('calculationResult');
        
        // Formatear el rango correctamente
        const rangeDisplay = interpretation.range && Array.isArray(interpretation.range) 
            ? `${interpretation.range[0]}-${interpretation.range[1]}`
            : 'N/A';
        
        // Determinar el percentil si existe
        const percentileDisplay = interpretation.percentile 
            ? `<div class="col-md-3">
                <h6 class="text-secondary">${interpretation.percentile}%</h6>
                <small class="text-muted">Percentil</small>
              </div>`
            : '';
        
        resultContainer.innerHTML = `
            <div class="alert alert-success">
                <h5 class="alert-heading">
                    <i class="fas fa-check-circle me-2"></i>
                    Resultado del Cálculo
                </h5>
                <hr>
                <div class="row">
                    <div class="col-md-3">
                        <h3 class="text-primary">${score}</h3>
                        <small class="text-muted">Puntaje Total</small>
                    </div>
                    <div class="col-md-3">
                        <h5 class="text-${interpretation.color}">${interpretation.level}</h5>
                        <small class="text-muted">Nivel de Severidad</small>
                    </div>
                    <div class="col-md-3">
                        <span class="badge bg-info fs-6">${rangeDisplay}</span>
                        <br><small class="text-muted">Rango Clínico</small>
                    </div>
                    ${percentileDisplay}
                </div>
                <div class="mt-3">
                    <strong>Interpretación:</strong>
                    <p class="mb-2">${interpretation.description || 'Ver detalles clínicos completos.'}</p>
                </div>
                <div class="mt-3">
                    <strong>Recomendación Clínica:</strong>
                    <p class="mb-0">${this.getClinicalRecommendation({testId: this.calculatorCurrentTest.id, interpretation})}</p>
                </div>
            </div>
        `;
        
        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    }

    openInterpretation() {
        if (this.testResults.length === 0) {
            this.showAlert('No hay resultados de tests para interpretar. Complete al menos un test primero.', 'warning');
            return;
        }

        const modal = this.createInterpretationModal();
        document.body.appendChild(modal);
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    createInterpretationModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header" style="background: var(--psiqui-secondary); color: white;">
                        <h5 class="modal-title">
                            <i class="fas fa-chart-bar me-2"></i>
                            Guía de Interpretación de Resultados
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-4">
                                <h6 class="text-primary mb-3">Mis Resultados</h6>
                                <div id="myResultsList">
                                    ${this.getMyResultsForInterpretation()}
                                </div>
                            </div>
                            <div class="col-md-8">
                                <h6 class="text-secondary mb-3">Interpretación Detallada</h6>
                                <div id="detailedInterpretation">
                                    ${this.getInterpretationGuide()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }

    getMyResultsForInterpretation() {
        return this.testResults.map(result => `
            <div class="card mb-2 cursor-pointer interpretation-result" onclick="psychometricManager.showDetailedInterpretation('${result.id}')">
                <div class="card-body p-3">
                    <h6 class="mb-1">${result.testName}</h6>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-primary">${result.score} pts</span>
                        <span class="badge bg-${result.interpretation.color}">${result.interpretation.level}</span>
                    </div>
                    <small class="text-muted">${result.date}</small>
                </div>
            </div>
        `).join('');
    }

    getInterpretationGuide() {
        return `
            <div class="alert alert-info">
                <h6><i class="fas fa-info-circle me-2"></i>Cómo Interpretar los Resultados</h6>
                <p class="mb-0">Seleccione un resultado de la izquierda para ver la interpretación detallada y recomendaciones clínicas específicas.</p>
            </div>
            
            <div class="accordion" id="interpretationAccordion">
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseRanges">
                            <i class="fas fa-ruler me-2"></i>Rangos de Puntuación Generales
                        </button>
                    </h2>
                    <div id="collapseRanges" class="accordion-collapse collapse show">
                        <div class="accordion-body">
                            ${this.getGeneralRangesHTML()}
                        </div>
                    </div>
                </div>
                
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseClinical">
                            <i class="fas fa-stethoscope me-2"></i>Consideraciones Clínicas
                        </button>
                    </h2>
                    <div id="collapseClinical" class="accordion-collapse collapse">
                        <div class="accordion-body">
                            ${this.getClinicalConsiderationsHTML()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showDetailedInterpretation(resultId) {
        const result = this.testResults.find(r => r.id === resultId);
        if (!result) return;
        
        const container = document.getElementById('detailedInterpretation');
        container.innerHTML = `
            <div class="alert alert-primary">
                <h6><i class="fas fa-chart-line me-2"></i>Interpretación: ${result.testName}</h6>
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Puntaje:</strong> ${result.score} puntos</p>
                        <p><strong>Nivel:</strong> <span class="badge bg-${result.interpretation.color}">${result.interpretation.level}</span></p>
                        <p><strong>Rango:</strong> ${result.interpretation.range}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Fecha:</strong> ${result.date}</p>
                        <p><strong>Percentil:</strong> ${result.interpretation.percentile}</p>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0"><i class="fas fa-prescription me-2"></i>Recomendación Clínica</h6>
                </div>
                <div class="card-body">
                    <p>${this.getClinicalRecommendation(result)}</p>
                </div>
            </div>
            
            <div class="card mt-3">
                <div class="card-header">
                    <h6 class="mb-0"><i class="fas fa-list-alt me-2"></i>Análisis Detallado por Pregunta</h6>
                </div>
                <div class="card-body">
                    ${this.generateDetailedAnalysis(result)}
                </div>
            </div>
        `;
    }

    downloadTestPDF() {
        if (this.testResults.length === 0) {
            this.showAlert('No hay resultados de tests para descargar. Complete al menos un test primero.', 'warning');
            return;
        }

        const modal = this.createDownloadModal();
        document.body.appendChild(modal);
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    createDownloadModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header" style="background: var(--psiqui-warning); color: white;">
                        <h5 class="modal-title">
                            <i class="fas fa-download me-2"></i>
                            Descargar Reporte en PDF
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-primary mb-3">Seleccionar Tests</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="selectAllTests" onchange="psychometricManager.toggleAllTests()">
                                    <label class="form-check-label fw-bold" for="selectAllTests">
                                        Seleccionar Todos
                                    </label>
                                </div>
                                <hr>
                                <div id="testsList">
                                    ${this.getTestsListForDownload()}
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-secondary mb-3">Opciones de Reporte</h6>
                                <div class="mb-3">
                                    <label class="form-label">Tipo de Reporte</label>
                                    <select class="form-select" id="reportType">
                                        <option value="summary">Resumen Ejecutivo</option>
                                        <option value="detailed">Reporte Detallado</option>
                                        <option value="clinical">Reporte Clínico Completo</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="includeCharts" checked>
                                        <label class="form-check-label" for="includeCharts">
                                            Incluir Gráficos
                                        </label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="includeRecommendations" checked>
                                        <label class="form-check-label" for="includeRecommendations">
                                            Incluir Recomendaciones Clínicas
                                        </label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="includeHistory">
                                        <label class="form-check-label" for="includeHistory">
                                            Incluir Historial de Tests
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Información del Paciente (Opcional)</label>
                                    <input type="text" class="form-control mb-2" id="patientName" placeholder="Nombre del paciente">
                                    <input type="text" class="form-control" id="patientId" placeholder="ID del paciente">
                                </div>
                            </div>
                        </div>
                        
                        <div class="text-center mt-4">
                            <button class="btn btn-warning btn-lg" onclick="psychometricManager.generatePDF()">
                                <i class="fas fa-file-pdf me-2"></i>
                                Generar y Descargar PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }

    getTestsListForDownload() {
        return this.testResults.map(result => `
            <div class="form-check mb-2">
                <input class="form-check-input test-checkbox" type="checkbox" id="test_${result.id}" value="${result.id}">
                <label class="form-check-label" for="test_${result.id}">
                    <strong>${result.testName}</strong><br>
                    <small class="text-muted">${result.date} - ${result.score} pts (${result.interpretation.level})</small>
                </label>
            </div>
        `).join('');
    }

    toggleAllTests() {
        const selectAll = document.getElementById('selectAllTests');
        const checkboxes = document.querySelectorAll('.test-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll.checked;
        });
    }

    generatePDF() {
        const selectedTests = Array.from(document.querySelectorAll('.test-checkbox:checked'))
            .map(cb => parseInt(cb.value)); // Convertir a números
        
        console.log('Tests seleccionados:', selectedTests);
        console.log('Todos los resultados disponibles:', this.testResults.map(r => ({ id: r.id, name: r.testName })));
        
        if (selectedTests.length === 0) {
            this.showAlert('Seleccione al menos un test para incluir en el PDF.', 'warning');
            return;
        }
        
        const reportType = document.getElementById('reportType').value;
        const includeCharts = document.getElementById('includeCharts').checked;
        const includeRecommendations = document.getElementById('includeRecommendations').checked;
        const includeHistory = document.getElementById('includeHistory').checked;
        const patientName = document.getElementById('patientName').value;
        const patientId = document.getElementById('patientId').value;
        
        // Generar contenido del PDF
        const pdfContent = this.createPDFContent({
            selectedTests,
            reportType,
            includeCharts,
            includeRecommendations,
            includeHistory,
            patientName,
            patientId
        });
        
        console.log('Contenido del PDF generado:', pdfContent);
        
        // Validar que hay resultados
        if (!pdfContent.results || pdfContent.results.length === 0) {
            this.showAlert('No se encontraron resultados para los tests seleccionados.', 'error');
            return;
        }
        
        // Simular descarga (en una implementación real usarías jsPDF o similar)
        this.simulatePDFDownload(pdfContent, patientName || 'reporte-tests');
    }

    createPDFContent(options) {
        // Asegurar que ambos lados de la comparación sean del mismo tipo
        const selectedResults = this.testResults.filter(result => {
            const resultId = typeof result.id === 'string' ? parseInt(result.id) : result.id;
            const isIncluded = options.selectedTests.includes(resultId);
            console.log(`Comparando result.id: ${resultId} (${typeof resultId}) con selectedTests:`, options.selectedTests, '=> incluido:', isIncluded);
            return isIncluded;
        });
        
        console.log(`Filtrados ${selectedResults.length} resultados de ${this.testResults.length} totales`);
        
        // Mapear tipo de reporte
        const reportTypeNames = {
            'summary': 'Resumen Ejecutivo',
            'detailed': 'Reporte Detallado',
            'clinical': 'Reporte Clínico Completo'
        };
        
        return {
            title: `Reporte de Evaluación Psicométrica - ${reportTypeNames[options.reportType] || options.reportType}`,
            patient: {
                name: options.patientName || 'Paciente',
                id: options.patientId || 'N/A'
            },
            date: new Date().toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            time: new Date().toLocaleTimeString('es-ES'),
            results: selectedResults,
            options: options,
            reportType: reportTypeNames[options.reportType] || options.reportType
        };
    }

    simulatePDFDownload(content, filename) {
        console.log('Iniciando generación de PDF...');
        console.log('Contenido a generar:', content);
        
        // Crear contenido HTML para previsualización
        const htmlContent = this.generatePDFPreview(content);
        
        console.log('HTML generado, longitud:', htmlContent.length);
        
        // Abrir en nueva ventana para impresión/guardado
        try {
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            
            if (!printWindow) {
                this.showAlert('Por favor permita ventanas emergentes para generar el PDF.', 'warning');
                return;
            }
            
            printWindow.document.open();
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            
            console.log('Ventana abierta y contenido escrito');
            
            // Esperar a que se cargue completamente
            printWindow.onload = () => {
                console.log('Ventana cargada, activando diálogo de impresión...');
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                }, 500);
            };
            
            this.showAlert('Reporte generado. Use Ctrl+P o Cmd+P para guardar como PDF.', 'success');
            
        } catch (error) {
            console.error('Error generando PDF:', error);
            this.showAlert('Error al generar el PDF. Verifique que las ventanas emergentes estén permitidas.', 'error');
        }
    }

    generatePDFPreview(content) {
        // Función helper para formatear rango
        const formatRange = (range) => {
            if (!range) return 'N/A';
            if (Array.isArray(range)) return `${range[0]}-${range[1]}`;
            return String(range);
        };
        
        // Función helper para formatear fecha
        const formatDate = (dateStr) => {
            try {
                const date = new Date(dateStr);
                return date.toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                return dateStr;
            }
        };
        
        return `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${content.title}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        line-height: 1.6;
                        color: #333;
                        max-width: 210mm;
                        margin: 0 auto;
                        padding: 20mm;
                        background: white;
                    }
                    .header { 
                        text-align: center; 
                        border-bottom: 3px solid #4A7C59; 
                        padding-bottom: 20px; 
                        margin-bottom: 30px; 
                    }
                    .header h1 {
                        color: #4A7C59;
                        font-size: 28px;
                        margin-bottom: 10px;
                    }
                    .header-info {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 15px;
                        padding: 10px;
                        background: #f8f9fa;
                        border-radius: 5px;
                    }
                    .header-info div {
                        text-align: left;
                    }
                    .result-item { 
                        margin-bottom: 40px; 
                        padding: 25px; 
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        page-break-inside: avoid;
                    }
                    .result-item h2 {
                        color: #4A7C59;
                        font-size: 22px;
                        margin-bottom: 15px;
                        border-bottom: 2px solid #e0e0e0;
                        padding-bottom: 10px;
                    }
                    .result-header {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 20px;
                        padding: 15px;
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                        border-radius: 5px;
                    }
                    .score-box {
                        text-align: center;
                        padding: 15px;
                        background: white;
                        border: 2px solid #4A7C59;
                        border-radius: 8px;
                        min-width: 100px;
                    }
                    .score { 
                        font-size: 32px; 
                        font-weight: bold; 
                        color: #4A7C59;
                        display: block;
                    }
                    .score-label {
                        font-size: 12px;
                        color: #666;
                        text-transform: uppercase;
                        margin-top: 5px;
                    }
                    .interpretation-box { 
                        background: #fff3cd; 
                        padding: 20px; 
                        margin: 15px 0;
                        border-left: 4px solid #ffc107;
                        border-radius: 4px;
                    }
                    .interpretation-box h4 {
                        color: #856404;
                        margin-bottom: 10px;
                    }
                    .recommendation-box {
                        background: #d1ecf1;
                        padding: 20px;
                        margin: 15px 0;
                        border-left: 4px solid #0c5460;
                        border-radius: 4px;
                    }
                    .recommendation-box h4 {
                        color: #0c5460;
                        margin-bottom: 10px;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        margin: 15px 0;
                    }
                    .info-item {
                        padding: 10px;
                        background: #f8f9fa;
                        border-radius: 4px;
                    }
                    .info-item strong {
                        color: #4A7C59;
                        display: block;
                        margin-bottom: 5px;
                    }
                    .footer { 
                        margin-top: 50px; 
                        padding-top: 20px;
                        border-top: 2px solid #e0e0e0;
                        text-align: center; 
                        font-size: 11px; 
                        color: #666;
                    }
                    .footer p {
                        margin: 5px 0;
                    }
                    @media print { 
                        body { 
                            margin: 0; 
                            padding: 15mm;
                        }
                        .result-item {
                            page-break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🧠 PsiquiApp</h1>
                    <h2 style="color: #666; font-size: 18px; font-weight: normal;">${content.title}</h2>
                    <div class="header-info">
                        <div>
                            <strong>Paciente:</strong> ${content.patient.name}<br>
                            <strong>ID:</strong> ${content.patient.id}
                        </div>
                        <div style="text-align: right;">
                            <strong>Fecha de Reporte:</strong> ${content.date}<br>
                            <strong>Hora:</strong> ${content.time}
                        </div>
                    </div>
                </div>
                
                ${content.results && content.results.length > 0 ? content.results.map((result, index) => `
                    <div class="result-item">
                        <h2>📋 ${index + 1}. ${result.testName}</h2>
                        
                        <div class="result-header">
                            <div>
                                <strong>Fecha de Evaluación:</strong><br>
                                ${formatDate(result.date)}
                            </div>
                            <div class="score-box">
                                <span class="score">${result.score}</span>
                                <span class="score-label">Puntaje Total</span>
                            </div>
                        </div>
                        
                        <div class="info-grid">
                            <div class="info-item">
                                <strong>Nivel de Severidad</strong>
                                ${result.interpretation.level || 'No disponible'}
                            </div>
                            <div class="info-item">
                                <strong>Rango Clínico</strong>
                                ${formatRange(result.interpretation.range)}
                            </div>
                            ${result.interpretation.percentile ? `
                                <div class="info-item">
                                    <strong>Percentil</strong>
                                    ${result.interpretation.percentile}%
                                </div>
                            ` : ''}
                        </div>
                        
                        ${result.interpretation.description ? `
                            <div class="interpretation-box">
                                <h4>📊 Interpretación Clínica</h4>
                                <p>${result.interpretation.description}</p>
                            </div>
                        ` : ''}
                        
                        ${content.options.includeRecommendations ? `
                            <div class="recommendation-box">
                                <h4>💡 Recomendación Clínica</h4>
                                <p>${this.getClinicalRecommendation(result)}</p>
                            </div>
                        ` : ''}
                    </div>
                `).join('') : '<p style="text-align: center; padding: 40px; color: #999;">No se encontraron resultados para mostrar.</p>'}
                
                <div class="footer">
                    <p><strong>📄 Reporte generado por PsiquiApp</strong></p>
                    <p>Fecha y hora de generación: ${new Date().toLocaleString('es-ES')}</p>
                    <p style="margin-top: 15px; font-style: italic;">Este reporte es confidencial y debe ser interpretado por un profesional de salud mental calificado.</p>
                    <p>Los resultados de las pruebas psicométricas son herramientas de apoyo diagnóstico y no sustituyen una evaluación clínica completa.</p>
                </div>
            </body>
            </html>
        `;
    }

    exportResults() {
        if (this.testResults.length === 0) {
            this.showAlert('No hay resultados de tests para exportar. Complete al menos un test primero.', 'warning');
            return;
        }

        const modal = this.createExportModal();
        document.body.appendChild(modal);
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    createExportModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header" style="background: var(--psiqui-info); color: white;">
                        <h5 class="modal-title">
                            <i class="fas fa-file-export me-2"></i>
                            Exportar Resultados
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-primary mb-3">Formato de Exportación</h6>
                                <div class="list-group">
                                    <label class="list-group-item">
                                        <input class="form-check-input me-1" type="radio" name="exportFormat" value="json" checked>
                                        <strong>JSON</strong> - Formato estructurado para análisis
                                    </label>
                                    <label class="list-group-item">
                                        <input class="form-check-input me-1" type="radio" name="exportFormat" value="csv">
                                        <strong>CSV</strong> - Compatible con Excel y estadísticas
                                    </label>
                                    <label class="list-group-item">
                                        <input class="form-check-input me-1" type="radio" name="exportFormat" value="xml">
                                        <strong>XML</strong> - Formato estándar para sistemas
                                    </label>
                                </div>
                                
                                <div class="mt-4">
                                    <h6 class="text-secondary mb-3">Opciones de Datos</h6>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="includePersonalData" checked>
                                        <label class="form-check-label" for="includePersonalData">
                                            Incluir datos de identificación
                                        </label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="includeResponses" checked>
                                        <label class="form-check-label" for="includeResponses">
                                            Incluir respuestas detalladas
                                        </label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="includeInterpretations" checked>
                                        <label class="form-check-label" for="includeInterpretations">
                                            Incluir interpretaciones
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-secondary mb-3">Previsualización de Datos</h6>
                                <div class="border rounded p-3" style="background: #f8f9fa; max-height: 300px; overflow-y: auto;">
                                    <pre id="exportPreview">${this.generateExportPreview('json')}</pre>
                                </div>
                                
                                <div class="mt-3">
                                    <small class="text-muted">
                                        <i class="fas fa-info-circle me-1"></i>
                                        Total de registros: ${this.testResults.length}
                                    </small>
                                </div>
                            </div>
                        </div>
                        
                        <div class="text-center mt-4">
                            <button class="btn btn-info btn-lg" onclick="psychometricManager.performExport()">
                                <i class="fas fa-download me-2"></i>
                                Exportar Datos
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Event listeners para preview
        modal.querySelectorAll('input[name="exportFormat"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateExportPreview(e.target.value);
            });
        });
        
        return modal;
    }

    generateExportPreview(format) {
        const sampleData = this.testResults.slice(0, 2); // Mostrar solo 2 registros como ejemplo
        
        switch (format) {
            case 'json':
                return JSON.stringify({
                    exported_at: new Date().toISOString(),
                    total_records: this.testResults.length,
                    results: sampleData
                }, null, 2);
                
            case 'csv':
                const headers = ['ID', 'Fecha', 'Test', 'Puntaje', 'Interpretación', 'Rango'];
                const rows = sampleData.map(r => 
                    [r.id, r.date, r.testName, r.score, r.interpretation.level, r.interpretation.range].join(',')
                );
                return [headers.join(','), ...rows, '...'].join('\n');
                
            case 'xml':
                return `<?xml version="1.0" encoding="UTF-8"?>\n<test_results>\n${sampleData.map(r => 
                    `  <result id="${r.id}">\n    <date>${r.date}</date>\n    <test>${r.testName}</test>\n    <score>${r.score}</score>\n  </result>`
                ).join('\n')}\n  ...\n</test_results>`;
                
            default:
                return 'Formato no soportado';
        }
    }

    updateExportPreview(format) {
        const preview = document.getElementById('exportPreview');
        if (preview) {
            preview.textContent = this.generateExportPreview(format);
        }
    }

    performExport() {
        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        const includePersonal = document.getElementById('includePersonalData').checked;
        const includeResponses = document.getElementById('includeResponses').checked;
        const includeInterpretations = document.getElementById('includeInterpretations').checked;
        
        const exportData = this.prepareExportData({
            format,
            includePersonal,
            includeResponses,
            includeInterpretations
        });
        
        this.downloadFile(exportData, `psiquiapp-resultados-${new Date().toISOString().split('T')[0]}.${format}`);
    }

    prepareExportData(options) {
        const exportResults = this.testResults.map(result => {
            const exportItem = {
                id: result.id,
                date: result.date,
                testId: result.testId,
                testName: result.testName,
                score: result.score
            };
            
            if (options.includeInterpretations) {
                exportItem.interpretation = result.interpretation;
            }
            
            if (options.includeResponses && result.responses) {
                exportItem.responses = result.responses;
            }
            
            return exportItem;
        });
        
        const exportObject = {
            exported_at: new Date().toISOString(),
            export_options: options,
            total_records: exportResults.length,
            results: exportResults
        };
        
        switch (options.format) {
            case 'json':
                return JSON.stringify(exportObject, null, 2);
                
            case 'csv':
                const headers = ['ID', 'Fecha', 'Test_ID', 'Test_Nombre', 'Puntaje'];
                if (options.includeInterpretations) {
                    headers.push('Interpretacion', 'Rango', 'Percentil');
                }
                
                const rows = exportResults.map(r => {
                    const row = [r.id, r.date, r.testId, r.testName, r.score];
                    if (options.includeInterpretations) {
                        row.push(r.interpretation.level, r.interpretation.range, r.interpretation.percentile);
                    }
                    return row.join(',');
                });
                
                return [headers.join(','), ...rows].join('\n');
                
            case 'xml':
                return `<?xml version="1.0" encoding="UTF-8"?>\n<test_results exported_at="${exportObject.exported_at}">\n${exportResults.map(r => 
                    `  <result id="${r.id}">\n    <date>${r.date}</date>\n    <test_id>${r.testId}</test_id>\n    <test_name><![CDATA[${r.testName}]]></test_name>\n    <score>${r.score}</score>${options.includeInterpretations ? `\n    <interpretation>\n      <level>${r.interpretation.level}</level>\n      <range>${r.interpretation.range}</range>\n    </interpretation>` : ''}\n  </result>`
                ).join('\n')}\n</test_results>`;
                
            default:
                return JSON.stringify(exportObject, null, 2);
        }
    }

    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.showAlert(`Archivo ${filename} descargado correctamente.`, 'success');
    }

    getGeneralRangesHTML() {
        return `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="text-primary">Tests de Depresión (PHQ-9, Beck)</h6>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item d-flex justify-content-between">
                            <span>Mínima</span>
                            <span class="badge bg-success">0-4 / 0-13</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between">
                            <span>Leve</span>
                            <span class="badge bg-warning">5-9 / 14-19</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between">
                            <span>Moderada</span>
                            <span class="badge bg-danger">10-14 / 20-28</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between">
                            <span>Severa</span>
                            <span class="badge bg-dark">15+ / 29+</span>
                        </li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h6 class="text-secondary">Tests de Ansiedad (GAD-7, Beck)</h6>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item d-flex justify-content-between">
                            <span>Mínima</span>
                            <span class="badge bg-success">0-4 / 0-7</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between">
                            <span>Leve</span>
                            <span class="badge bg-warning">5-9 / 8-15</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between">
                            <span>Moderada</span>
                            <span class="badge bg-danger">10-14 / 16-25</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between">
                            <span>Severa</span>
                            <span class="badge bg-dark">15+ / 26+</span>
                        </li>
                    </ul>
                </div>
            </div>
        `;
    }

    getClinicalConsiderationsHTML() {
        return `
            <div class="alert alert-warning">
                <h6><i class="fas fa-exclamation-triangle me-2"></i>Importantes Consideraciones Clínicas</h6>
                <ul class="mb-0">
                    <li><strong>Contexto del Paciente:</strong> Los puntajes deben interpretarse considerando el contexto clínico, cultural y personal del paciente.</li>
                    <li><strong>Evaluación Profesional:</strong> Estos tests son herramientas de screening, no reemplazan la evaluación clínica profesional.</li>
                    <li><strong>Seguimiento:</strong> Los puntajes elevados requieren evaluación adicional y posible derivación a especialista.</li>
                    <li><strong>Cambios en el Tiempo:</strong> Monitorear cambios en puntajes a lo largo del tiempo para evaluar progreso del tratamiento.</li>
                </ul>
            </div>
        `;
    }

    showAlert(message, type = 'info') {
        // Crear elemento de alerta
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        // Auto-remove después de 5 segundos
        setTimeout(() => {
            if (alert && alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
    
    // Método para limpiar duplicados manualmente
    clearDuplicates() {
        const before = this.testResults.length;
        const uniqueResults = [];
        const seenIds = new Set();
        
        for (const result of this.testResults) {
            if (!seenIds.has(result.id)) {
                seenIds.add(result.id);
                uniqueResults.push(result);
            }
        }
        
        this.testResults = uniqueResults;
        localStorage.setItem('psychometric_results', JSON.stringify(this.testResults));
        
        const removed = before - this.testResults.length;
        if (removed > 0) {
            this.showAlert(`Se eliminaron ${removed} resultados duplicados.`, 'success');
        } else {
            this.showAlert('No se encontraron duplicados.', 'info');
        }
    }
    
    // Método para limpiar todos los resultados
    clearAllResults() {
        if (confirm('¿Está seguro de eliminar TODOS los resultados guardados? Esta acción no se puede deshacer.')) {
            this.testResults = [];
            localStorage.removeItem('psychometric_results');
            this.showAlert('Todos los resultados han sido eliminados.', 'success');
            
            // Recargar la página para actualizar la UI
            setTimeout(() => {
                location.reload();
            }, 1500);
        }
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    window.psychometricManager = new PsychometricTestManager();
});