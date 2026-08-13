import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { 
  LucideAngularModule, 
  LayoutDashboard, Package, DollarSign, Wrench, DatabaseBackup, 
  Menu, Gamepad2, Calendar, Image, MapPin, Edit, Trash2, Edit2, Mail,
  CheckCircle, AlertCircle, PlusCircle, Plus, Lock, BarChart2, X, TriangleAlert, Save, RefreshCw,
  Download, AlertTriangle, FileSpreadsheet, User, Activity, Upload, ArrowLeft, ArrowRight,
  CalendarClock, TrendingDown, TrendingUp, ClipboardList, CalendarDays, CalendarCheck, Moon, Sun, Camera, Info,
  Bell, AlertOctagon, BellOff, Award, Code, ZoomIn, FileText,
  Palette, Accessibility, ScanFace, Globe, Type, Settings, Database, History, BellRing, Delete, Shield,
  Fingerprint, Monitor
} from 'lucide-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    importProvidersFrom(LucideAngularModule.pick({
      LayoutDashboard, Package, DollarSign, Wrench, DatabaseBackup, 
      Menu, Gamepad2, Calendar, Image, MapPin, Edit, Trash2, Edit2, Mail,
      CheckCircle, AlertCircle, PlusCircle, Plus, Lock, BarChart2, X, TriangleAlert, Save, RefreshCw,
      Download, AlertTriangle, FileSpreadsheet, User, Activity, Upload, ArrowLeft, ArrowRight,
      CalendarClock, TrendingDown, TrendingUp, ClipboardList, CalendarDays, CalendarCheck, Moon, Sun, Camera, Info,
      Bell, AlertOctagon, BellOff, Award, Code, ZoomIn, FileText,
      Palette, Accessibility, ScanFace, Globe, Type, Settings, Database, History, BellRing, Delete, Shield,
      Fingerprint, Monitor
    }))
  ]
};
