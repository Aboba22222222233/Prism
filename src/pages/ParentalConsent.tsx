import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ParentalConsent = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 font-geist">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-8 py-6 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Родительское согласие</h1>
                        <p className="text-sm text-slate-500">Платформа Prism</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-8 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 text-black">

                    <h2 className="text-2xl font-bold mb-6">PARENTAL CONSENT</h2>

                    <div className="space-y-8">
                        <div className="border-b border-slate-200 pb-8">
                            <h3 className="text-lg font-semibold mb-4">Вариант 1: Если регистрируется родитель (для ребенка)</h3>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 border-2 border-slate-400 rounded mt-0.5 flex-shrink-0"></div>
                                <p className="text-slate-700">
                                    Я подтверждаю, что являюсь законным представителем (родителем/опекуном) ребенка и даю полное согласие на сбор и обработку его данных в рамках платформы Prism. Я ознакомлен и принимаю Условия использования, Политику конфиденциальности и Этический регламент.
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Вариант 2: Если регистрируется ученик (самый частый случай)</h3>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 border-2 border-slate-400 rounded mt-0.5 flex-shrink-0"></div>
                                <p className="text-slate-700">
                                    Я подтверждаю, что получил разрешение от своих родителей (законных представителей) на использование платформы Prism. Я принимаю Условия использования и понимаю, что мои данные защищены принципом анонимности.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-200 py-8">
                <div className="max-w-4xl mx-auto px-8 text-center text-slate-400 text-sm">
                    © 2026 Prism. Все права защищены.
                </div>
            </div>
        </div>
    );
};

export default ParentalConsent;
