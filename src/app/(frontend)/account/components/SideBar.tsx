
const navLinks = [
  { href: '/account/profile', label: 'Thông tin cá nhân' },
  { href: '/account/management', label: 'Quản lý' },
  { href: '/account/setting', label: 'Cài đặt tài khoản' },
  { href: '/account/membership', label: 'Gói Hội Viên' },
]

export default function SideBar() {
  return (
    <div className="w-64 bg-gray-100 p-4">
      <h2 className="text-xl font-bold mb-4">Tài khoản của tôi</h2>
      <ul>
        {navLinks.map((link) => (
          <li key={link.href} className="mb-2">
            <a href={link.href} className="text-red-500 hover:underline">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}