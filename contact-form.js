class ContactForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background-color: var(--color-surface);
                    padding: 1.5rem;
                    border-radius: 12px;
                    border: 1px solid var(--color-border);
                    box-shadow: 0 8px 32px 0 var(--shadow-color);
                    max-width: 500px;
                    margin: 2rem auto;
                }
                form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .form-control {
                    display: flex;
                    flex-direction: column;
                    text-align: left;
                }
                label {
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                    color: var(--color-text-secondary);
                }
                input[type="text"],
                input[type="email"],
                textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid var(--color-border);
                    background-color: var(--color-background);
                    color: var(--color-text-primary);
                    border-radius: 6px;
                    font-size: 1rem;
                }
                textarea {
                    min-height: 100px;
                    resize: vertical;
                }
                button {
                    padding: 0.8rem 1.5rem;
                    border: none;
                    background-color: var(--color-accent);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: bold;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px 0 var(--glow-color);
                }
                button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px 0 var(--glow-color);
                }
                .form-status {
                    margin-top: 1rem;
                    padding: 0.75rem;
                    border-radius: 6px;
                    text-align: center;
                }
                .form-status.success {
                    background-color: #28a745;
                    color: white;
                }
                .form-status.error {
                    background-color: #dc3545;
                    color: white;
                }
            </style>
            <form action="https://formspree.io/f/mykpdlyn" method="POST">
                <h2>문의하기</h2>
                <div class="form-control">
                    <label for="name">이름</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-control">
                    <label for="email">이메일</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-control">
                    <label for="message">문의 내용</label>
                    <textarea id="message" name="message" required></textarea>
                </div>
                <button type="submit">문의 보내기</button>
                <div id="form-status" class="form-status" style="display:none;"></div>
            </form>
        `;

        const form = this.shadowRoot.querySelector('form');
        const formStatus = this.shadowRoot.querySelector('#form-status');

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(form);

            formStatus.style.display = 'none';
            formStatus.textContent = '';
            formStatus.classList.remove('success', 'error');

            try {
                const response = await fetch(form.action, {
                    method: form.method,
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    formStatus.textContent = '문의가 성공적으로 전송되었습니다!';
                    formStatus.classList.add('success');
                    form.reset();
                } else {
                    const data = await response.json();
                    if (data.errors) {
                        formStatus.textContent = data.errors.map(error => error.message).join(', ');
                    } else {
                        formStatus.textContent = '문의 전송에 실패했습니다.';
                    }
                    formStatus.classList.add('error');
                }
            } catch (error) {
                formStatus.textContent = '네트워크 오류가 발생했습니다.';
                formStatus.classList.add('error');
            } finally {
                formStatus.style.display = 'block';
            }
        });
    }
}

customElements.define('contact-form', ContactForm);
