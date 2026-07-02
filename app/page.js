import { redirect } from 'next/navigation';

export default function RootPage() {
  // redirect('/dashboard');

  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <h1>Hello</h1>
      <div id='home'>
        {/* محتوى توجيهي عباره عن تيكست بتصميم مريح ومفهوم للزائر*/}
        <p className='text-red-500 bg-blue-500 p-2 text-white text-xl font-bold shadow'>مرحبا بك في موقعنا</p>
        <p className='text-red-500 bg-blue-500 p-2 text-white text-xl font-bold shadow'>هذا الموقع مخصص لتقديم الخدمات المصرفية</p>
        <p className='text-red-500 bg-blue-500 p-2 text-white text-xl font-bold shadow'>يمكنك الاستفادة من خدماتنا المتنوعة</p>
        <p className='text-red-500 bg-blue-500 p-2 text-white text-xl font-bold shadow'>للمزيد من المعلومات يرجى زيارة <a href="/dashboard">لوحة التحكم</a></p>  
        <p className='text-red-500 bg-blue-500 p-2 text-white text-xl font-bold shadow'>لتجربة الخدمات المصرفية يرجى <a href="/connect">تسجيل الدخول</a></p>  
      </div>
    </div>
  );
}
