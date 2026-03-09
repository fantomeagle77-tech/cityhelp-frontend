import MailIcon from "../assets/icons/mail.svg";
import TelegramIcon from "../assets/icons/telegram.svg";
import Seo from "../components/Seo";
import { Link } from "react-router-dom";

export default function AboutPage() {
return (
  <>
    <Seo
      title="О проекте CityHelp — частный независимый городской сервис"
      description="CityHelp — частный независимый сервис взаимопомощи жителей. Это не гос-портал: цель — дать людям прозрачную картину по дому, двору и району."
      canonical="https://cityhelp.app/about"
    />

    <div className="about-page">
      <h1>О проекте</h1>

      <p>
        CityHelp — открытая карта обращений жителей по домам и дворам: жалобы, статусы, аналитика и соседская помощь.
      </p>

      <p>
        Пользователи могут видеть реальную обстановку в своём доме, дворе, районе
        оставлять жалобы и анализировать ситуацию.
      </p>

      <h2>Важно</h2>

      <p>
        CityHelp — <strong>частная независимая инициатива</strong>. Проект <strong>не является государственным сервисом</strong>,
        не относится к ЖКХ, администрации или другим официальным структурам.
      </p>
      
      <p>
        Цель проекта — помочь жителям <strong>трезво и наглядно</strong> оценивать состояние дома и двора,
        делиться наблюдениями и находить поддержку рядом.
        Мы не собираем «досье», не используем данные для наказаний и не занимаемся «проверками».
      </p>
      
      <p>
        Здесь публикуются сообщения от пользователей: они могут быть субъективными.
        Поэтому мы поощряем <strong>корректные формулировки</strong>, факты и, по возможности, подтверждения.
        Если проблема решена — это тоже важно отметить.
      </p>

      <h2>Приватность и безопасность</h2>

        <ul>
          <li>
            <strong>Минимум данных.</strong> Для просмотра карты регистрация не требуется.
          </li>
          <li>
            <strong>Не просим паспортные данные.</strong> Не собираем ФИО, паспорт, адрес проживания, место работы и т.п.
          </li>
          <li>
            <strong>Контакты — только по желанию.</strong> Если вы создаёте запрос “Соседская помощь”, контакт можно указать добровольно
            (например, Telegram). Не хотите — не указывайте.
          </li>
          <li>
            <strong>Публичность сообщений.</strong> Тексты обращений и отметки на карте видны другим пользователям — поэтому не публикуйте
            персональные данные (свои или чужие) и точные детали, которые могут навредить.
          </li>
          <li>
            <strong>Безопасный тон.</strong> Пишите по делу: что случилось, где и когда. Без обвинений, угроз и персональных “разборок”.
          </li>
          <li>
            <strong>Фото — осторожно.</strong> Если добавляете фото, избегайте лиц, номеров авто и любых идентификаторов.
          </li>
        </ul>
        
        <p>
          Если вы заметили опасный контент или утечку персональных данных — напишите в контакты проекта, мы постараемся оперативно убрать.
        </p>
      
      <h2>Зачем это нужно?</h2>

      <ul>
        <li>Понимание реальной ситуации в районе</li>
        <li>Совместное участие в улучшении среды</li>
        <li>Мнения и наблюдения жителей без искажений</li>
        <li>Честный взгляд на район</li>
        <li>Сообщество, которое заботится</li>
        <li>Реальные истории от жителей</li>
        <li>Открытая информация о жизни района</li>
        <li>Вклад каждого в общее благо</li>
        <li>Живые отзывы и опыт соседей</li>
      </ul>

      <h2>Как работает система статусов?</h2>

      <ul>
        <li>🟢 Норма — жалоб нет</li>
        <li>🟡 Есть жалобы</li>
        <li>🟠 Проблемно</li>
        <li>🔴 Критично</li>
      </ul>

      <div className="about-contacts">
        <h2>Доверие и правила</h2>
      
        <div className="contact-row">
          <Link className="contact-btn" to="/privacy">
            Приватность
          </Link>
      
          <Link className="contact-btn" to="/safety">
            Безопасность
          </Link>
        </div>
      
        <div className="contact-note">
          Эти страницы объясняют, что CityHelp — частный независимый сервис взаимопомощи и как мы защищаем пользователей.
        </div>

        <Link className="contact-btn" to="/how-it-works">
          Как это работает
        </Link>

        <Link className="contact-btn" to="/faq">
          FAQ
        </Link>
        
        <Link className="contact-btn" to="/moderation">
          Модерация
        </Link>
        
      </div>

      {/* Контакты */}
      <section className="about-contacts">
        <h2>Контакты</h2>

        <div className="contact-row">
          {/* Email */}
          <a className="contact-btn" href="mailto:fantomeagle77@gmail.com">
            <span className="contact-ico">
              <img src={MailIcon} alt="" className="contact-svg" />
            </span>
            <span>fantomeagle77@gmail.com</span>
          </a>

          {/* Telegram */}
          <a
            className="contact-btn"
            href="https://t.me/alphasoftlab"
            target="_blank"
            rel="noreferrer"
            title="По вопросам сотрудничества и поддержки проекта"
          >
            <span className="contact-ico">
              <img src={TelegramIcon} alt="" className="contact-svg" />
            </span>
            <span>Telegram: @alphasoftlab</span>
          </a>

          <div className="contact-note">
            По вопросам сотрудничества и поддержки проекта — пишите в Telegram. Проект частный, открытый и сделан для жителей.
          </div>

          <div style={{ marginTop: 16 }}>
            <a
              className="contact-btn"
              href="https://t.me/alphasoftlab"
              target="_blank"
              rel="noreferrer"
            >
              Поддержать проект
            </a>
          </div>
          
          <div className="contact-note">
            Если проект вам полезен, вы можете поддержать его и написать по вопросам сотрудничества в Telegram.
          </div>
          
        </div>
      </section>
      <div style={{ marginTop: 28, paddingTop: 18, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 13, color: "rgba(0,0,0,0.65)" }}>
          © {new Date().getFullYear()} CityHelp (AlphaSoftLab). Лицензия: PolyForm Noncommercial.
        </div>
      </div>
    </div>
  </>
);
}
